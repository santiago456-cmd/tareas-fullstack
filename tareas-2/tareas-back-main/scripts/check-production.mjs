import { cp, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const root = new URL('../', import.meta.url);
const directory = await mkdtemp(join(tmpdir(), 'tareas-production-'));
function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: directory, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} terminó con ${code}`))
    );
  });
}
try {
  for (const name of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
    await copyFile(new URL(name, root), join(directory, name));
  }
  await cp(new URL('dist', root), join(directory, 'dist'), { recursive: true });
  await run('pnpm', ['install', '--prod', '--frozen-lockfile']);
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    SQLITE_STORAGE: join(directory, 'smoke.sqlite'),
    KEYCLOAK_BASE_URL: 'http://localhost:8081',
    KEYCLOAK_REALM: 'proyecto-tareas',
  };
  await run('pnpm', ['run', 'init-db'], env);
  await run(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import { createApp } from './dist/app.js';
    import { sequelize } from './dist/config/database.js';
    const server = createApp().listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const base = 'http://127.0.0.1:' + server.address().port;
      assert.equal((await fetch(base + '/api/health-check')).status, 200);
      const docs = await fetch(base + '/api/docs/');
      assert.equal(docs.status, 200);
      assert.match(await docs.text(), /swagger-ui/);
      console.log('Producción: arranque, health-check y Swagger correctos sin devDependencies');
    } finally {
      await new Promise(resolve => server.close(resolve));
      await sequelize.close();
    }
  `,
    ],
    env
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
