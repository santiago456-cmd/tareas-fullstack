import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const project = new URL('../', import.meta.url);
test('init-db sale 0 en éxito/repetición y 1 cuando SQLite no puede abrir una base válida', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tareas-init-'));
  try {
    const storage = join(directory, 'database.sqlite');
    const run = () =>
      spawnSync(process.execPath, ['dist/scripts/initDb.js'], {
        cwd: project,
        env: { ...process.env, SQLITE_STORAGE: storage },
        encoding: 'utf8',
        timeout: 15000,
      });
    assert.equal(run().status, 0);
    assert.equal(run().status, 0);
    await writeFile(storage, 'not a SQLite database');
    const failed = run();
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /Error al inicializar/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('setup conserva contraseñas existentes y solo asigna una al crear un usuario nuevo', async () => {
  const source = await readFile(new URL('../scripts/setup-keycloak.sh', import.meta.url), 'utf8');
  const definition = source.slice(
    source.indexOf('create_user() {'),
    source.indexOf('\necho "→ Creando usuarios de prueba')
  );
  const result = spawnSync(
    'bash',
    [
      '-c',
      `
    set -euo pipefail
    REALM=test
    KEYCLOAK_DEMO_PASSWORD=solo-prueba
    exists=0
    resets=0
    user_exists() { test "$exists" = 1; }
    docker_kcadm() {
      if [[ "$1" == create && "$2" == users ]]; then exists=1; fi
      if [[ "$1" == set-password ]]; then resets=$((resets + 1)); fi
    }
    ${definition}
    create_user prueba prueba@example.test Test User usuario
    test "$resets" = 1
    unset KEYCLOAK_DEMO_PASSWORD
    create_user prueba prueba@example.test Test User usuario
    test "$resets" = 1
  `,
    ],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
});
