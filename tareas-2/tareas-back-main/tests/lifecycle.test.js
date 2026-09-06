import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { once } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { iniciarServidor } from '../dist/lifecycle.js';

const project = new URL('../', import.meta.url);

test('Cierre drena una solicitud en curso y cierra la base exactamente una vez', async () => {
  let started;
  const received = new Promise((resolve) => {
    started = resolve;
  });
  let finished = false,
    closed = 0;
  const runtime = await iniciarServidor({
    port: 0,
    host: '127.0.0.1',
    initialize: async () => {},
    closeDatabase: async () => {
      assert.ok(finished);
      closed++;
    },
    app: async (_req, res) => {
      started();
      await delay(70);
      finished = true;
      res.end('completada');
    },
  });
  const request = fetch(`http://127.0.0.1:${runtime.server.address().port}`).then((r) => r.text());
  await received;
  const stop = runtime.stop();
  assert.equal(runtime.stop(), stop);
  assert.equal(await request, 'completada');
  await stop;
  assert.equal(closed, 1);
});

test('Fallo de inicialización o puerto ocupado cierra la base y no deja listener', async () => {
  let closed = 0;
  await assert.rejects(
    iniciarServidor({
      port: 0,
      app: (_q, r) => r.end(),
      initialize: async () => {
        throw new Error('base caída');
      },
      closeDatabase: async () => {
        closed++;
      },
    }),
    /base caída/
  );
  const occupied = createServer();
  occupied.listen(0, '127.0.0.1');
  await once(occupied, 'listening');
  try {
    await assert.rejects(
      iniciarServidor({
        port: occupied.address().port,
        host: '127.0.0.1',
        app: (_q, r) => r.end(),
        initialize: async () => {},
        closeDatabase: async () => {
          closed++;
        },
      }),
      { code: 'EADDRINUSE' }
    );
    assert.equal(closed, 2);
  } finally {
    occupied.close();
    await once(occupied, 'close');
  }
});

test('Cierre forzado cumple el plazo y libera conexiones bloqueadas', async () => {
  let received;
  const started = new Promise((resolve) => {
    received = resolve;
  });
  let closed = false;
  const runtime = await iniciarServidor({
    port: 0,
    host: '127.0.0.1',
    shutdownTimeoutMs: 50,
    initialize: async () => {},
    closeDatabase: async () => {
      closed = true;
    },
    app: () => received(),
  });
  const request = fetch(`http://127.0.0.1:${runtime.server.address().port}`).catch(() => null);
  await started;
  await assert.rejects(runtime.stop(), /Tiempo de cierre/);
  await request;
  await delay(20);
  assert.ok(closed);
});

test('Importar app/server no crea la base ni inicia HTTP; configuración inválida falla antes de abrir SQLite', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tareas-import-'));
  const env = {
    ...process.env,
    SQLITE_STORAGE: join(directory, 'nested', 'db.sqlite'),
    PORT: 'invalid',
    KEYCLOAK_BASE_URL: '',
    KEYCLOAK_REALM: '',
  };
  try {
    const imported = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "await import('./dist/app.js'); await import('./dist/server.js')",
      ],
      { cwd: project, env, encoding: 'utf8', timeout: 5000 }
    );
    assert.equal(imported.status, 0, imported.stderr);
    assert.deepEqual(await readdir(directory), []);
    const failed = spawnSync(process.execPath, ['dist/server.js'], {
      cwd: project,
      env,
      encoding: 'utf8',
      timeout: 5000,
    });
    assert.equal(failed.status, 1);
    assert.deepEqual(await readdir(directory), []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Proceso real rechaza esquema pendiente y sale limpiamente ante SIGTERM y SIGINT', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tareas-process-'));
  const env = {
    ...process.env,
    SQLITE_STORAGE: join(directory, 'db.sqlite'),
    KEYCLOAK_BASE_URL: 'http://127.0.0.1:9999',
    KEYCLOAK_REALM: 'test',
  };
  try {
    const failed = spawnSync(process.execPath, ['dist/server.js'], {
      cwd: project,
      env,
      timeout: 5000,
      encoding: 'utf8',
    });
    assert.equal(failed.status, 1);
    const migrated = spawnSync(process.execPath, ['dist/scripts/migrateDb.js'], {
      cwd: project,
      env,
      timeout: 5000,
      encoding: 'utf8',
    });
    assert.equal(migrated.status, 0, migrated.stderr);
    for (const signal of ['SIGTERM', 'SIGINT']) {
      const probe = createServer();
      probe.listen(0, '127.0.0.1');
      await once(probe, 'listening');
      const port = probe.address().port;
      probe.close();
      await once(probe, 'close');
      const child = spawn(process.execPath, ['dist/server.js'], {
        cwd: project,
        env: { ...env, PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const exited = once(child, 'exit');
      let errors = '';
      child.stderr.on('data', (chunk) => {
        errors += chunk;
      });
      try {
        await new Promise((resolve, reject) => {
          const timeout = globalThis.setTimeout(
            () => reject(new Error('No inició: ' + errors)),
            5000
          );
          child.stdout.on('data', (chunk) => {
            if (String(chunk).includes('escuchando')) {
              globalThis.clearTimeout(timeout);
              resolve();
            }
          });
        });
        assert.equal((await fetch(`http://127.0.0.1:${port}/api/health-check`)).status, 200);
        child.kill(signal);
        assert.deepEqual(
          await Promise.race([
            exited,
            delay(5000, undefined, { ref: false }).then(() => {
              throw new Error('Proceso no cerró');
            }),
          ]),
          [0, null]
        );
      } finally {
        if (child.exitCode === null) child.kill('SIGKILL');
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
