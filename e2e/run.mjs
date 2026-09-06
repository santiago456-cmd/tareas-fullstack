import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = await mkdtemp(join(tmpdir(), "tareas-e2e-"));
const project = `tareas-e2e-${process.pid}`;
const compose = ["compose", "-p", project, "-f", join(root, "e2e/compose.yml")];
const children = [];
const abort = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => abort.abort());
function start(command, args, env = process.env) {
  const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
  const completion = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} terminó con ${code}`)),
    );
  });
  // Las finalizaciones se comprueban abajo; evitar rechazos sin consumidor durante el arranque.
  completion.catch(() => {});
  return { child, completion };
}
async function ready(url, timeout = 180000) {
  const end = Date.now() + timeout;
  let report = 0;
  while (Date.now() < end) {
    abort.signal.throwIfAborted();
    for (const entry of children)
      if (entry.child.exitCode !== null)
        throw new Error("Servidor E2E terminó antes de estar disponible");
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) return;
    } catch {
      /* aún iniciando */
    }
    if (Date.now() > report) {
      console.log(`Esperando servicio E2E: ${new URL(url).origin}`);
      report = Date.now() + 15000;
    }
    await delay(500, undefined, { signal: abort.signal });
  }
  throw new Error(`Servicio no disponible: ${url}`);
}
try {
  // Fallar si un puerto está ocupado: nunca reutilizar los servicios del usuario.
  const { createServer } = await import("node:net");
  for (const port of [18081, 13000, 15173]) {
    const probe = createServer();
    await new Promise((resolve, reject) => {
      probe.once("error", reject);
      probe.listen(port, "127.0.0.1", resolve);
    });
    await new Promise((resolve) => probe.close(resolve));
  }
  await start("pnpm", ["--dir", "tareas-2/tareas-back-main", "run", "build"]).completion;
  await start("docker", [...compose, "up", "-d"]).completion;
  await ready(
    "http://127.0.0.1:18081/realms/tareas-e2e/.well-known/openid-configuration",
  );
  const env = {
    ...process.env,
    TAREAS_E2E: "1",
    SQLITE_STORAGE: join(directory, "test.sqlite"),
    NODE_ENV: "test",
    PORT: "13000",
    CORS_ORIGIN: "http://127.0.0.1:15173",
    KEYCLOAK_BASE_URL: "http://127.0.0.1:18081",
    KEYCLOAK_REALM: "tareas-e2e",
    KEYCLOAK_AUDIENCE: "tareas-api",
    VITE_API_URL: "http://127.0.0.1:13000/api",
    VITE_KEYCLOAK_URL: "http://127.0.0.1:18081",
    VITE_KEYCLOAK_REALM: "tareas-e2e",
    VITE_KEYCLOAK_CLIENT_ID: "tareas-e2e-spa",
  };
  children.push(start(process.execPath, ["e2e/api.mjs"], env));
  children.push(
    start(
      process.execPath,
      [
        "tareas-2/tareas-fe/node_modules/vite/bin/vite.js",
        "tareas-2/tareas-fe",
        "--host",
        "127.0.0.1",
        "--port",
        "15173",
        "--strictPort",
      ],
      env,
    ),
  );
  await ready("http://127.0.0.1:13000/api/health-check", 30000);
  await ready("http://127.0.0.1:15173", 30000);
  const tests = start(
    process.execPath,
    [
      "tareas-2/tareas-fe/node_modules/@playwright/test/cli.js",
      "test",
      "--config",
      "tareas-2/tareas-fe/playwright.config.js",
    ],
    env,
  );
  children.push(tests);
  await Promise.race([
    tests.completion,
    new Promise((_, reject) =>
      abort.signal.addEventListener(
        "abort",
        () => reject(new Error("E2E interrumpido")),
        { once: true },
      ),
    ),
  ]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  for (const { child } of children)
    if (child.exitCode === null) child.kill("SIGTERM");
  await Promise.all(
    children.map(async ({ child, completion }) => {
      await Promise.race([completion.catch(() => {}), delay(5000)]);
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
    }),
  );
  try {
    await start("docker", [...compose, "down", "--volumes", "--remove-orphans"])
      .completion;
  } catch {
    console.error(`No se pudo limpiar el proyecto Docker ${project}`);
    process.exitCode = 1;
  }
  await rm(directory, { recursive: true, force: true });
}
