import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Sequelize, QueryTypes } from 'sequelize';
import { migrar, verificarMigraciones } from '../dist/migrations/runner.js';
import { migrations } from '../dist/migrations/definitions.js';
import { restaurarRespaldo } from '../dist/services/restoreService.js';

const connection = (storage) => new Sequelize({ dialect: 'sqlite', storage, logging: false });

test('Migración inicial y repetida; historial, índices y restricciones', async () => {
  const db = connection(':memory:');
  try {
    assert.equal((await migrar(db)).length, 2);
    assert.deepEqual(await migrar(db), []);
    await verificarMigraciones(db);
    await db.query("INSERT INTO CUENTAS VALUES (1,'sub','name',NULL)");
    await db.query("INSERT INTO LISTAS VALUES (1,'Lista',1,NULL,NULL,'2026-01-01')");
    await assert.rejects(
      db.query("INSERT INTO LISTAS VALUES (2,'Lista',1,NULL,NULL,'2026-01-01')")
    );
    await assert.rejects(
      db.query("INSERT INTO LISTAS VALUES (3,'Otra',999,NULL,NULL,'2026-01-01')")
    );
    const plan = await db.query(
      'EXPLAIN QUERY PLAN SELECT * FROM TAREAS WHERE ID_LISTA=1 ORDER BY FECHA_CREACION, ID_TAREA LIMIT 50',
      { type: QueryTypes.SELECT }
    );
    assert.ok(plan.some((row) => row.detail.includes('IX_tareas_lista_fecha_id')));
    await db.query("UPDATE SCHEMA_MIGRATIONS SET checksum='alterado' WHERE name='001-baseline'");
    await assert.rejects(migrar(db), /Historial/);
    await assert.rejects(verificarMigraciones(db), /incompatibles/);
  } finally {
    await db.close();
  }
});

test('Adopta SQLite anterior sin perder datos; fallos revierten historial y DDL', async () => {
  const db = connection(':memory:');
  try {
    for (const sql of migrations[0].sql) await db.query(sql);
    await db.query("INSERT INTO CUENTAS VALUES (7,'legacy','legacy',NULL)");
    await migrar(db);
    const [rows] = await db.query('SELECT * FROM CUENTAS');
    assert.equal(rows[0].ID_CUENTA, 7);
  } finally {
    await db.close();
  }
  for (const sql of [
    'CREATE TABLE CUENTAS (ID_CUENTA INTEGER)',
    ...['CREATE INDEX IX_tareas_lista_fecha_id ON TAREAS(TITULO)'],
  ]) {
    const bad = connection(':memory:');
    try {
      if (sql.startsWith('CREATE INDEX'))
        for (const baseline of migrations[0].sql) await bad.query(baseline);
      await bad.query(sql);
      await assert.rejects(migrar(bad));
      const [tables] = await bad.query(
        "SELECT name FROM sqlite_master WHERE name='SCHEMA_MIGRATIONS'"
      );
      assert.equal(tables.length, 0);
    } finally {
      await bad.close();
    }
  }
});

test('Restauración valida datos y FK, migra la copia y nunca sobrescribe un destino', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tareas-restore-'));
  const source = join(dir, 'backup.sqlite');
  const target = join(dir, 'restored.sqlite');
  const db = connection(source);
  try {
    await migrar(db);
    await db.query("INSERT INTO CUENTAS VALUES (1,'saved','saved',NULL)");
  } finally {
    await db.close();
  }
  try {
    await restaurarRespaldo(source, target);
    const restored = connection(target);
    try {
      await verificarMigraciones(restored);
      const [rows] = await restored.query('SELECT KEYCLOAK_SUB FROM CUENTAS');
      assert.equal(rows[0].KEYCLOAK_SUB, 'saved');
    } finally {
      await restored.close();
    }
    const before = await readFile(target);
    await assert.rejects(restaurarRespaldo(source, target));
    assert.deepEqual(await readFile(target), before);
    const corrupt = join(dir, 'corrupt.sqlite');
    await writeFile(corrupt, 'invalid');
    await assert.rejects(restaurarRespaldo(corrupt, join(dir, 'invalid.sqlite')));
    assert.ok(!(await readdir(dir)).includes('invalid.sqlite'));
    await writeFile(join(dir, 'stale.sqlite-wal'), 'stale');
    await assert.rejects(restaurarRespaldo(source, join(dir, 'stale.sqlite')), /destino tiene/);
    await writeFile(source + '-wal', 'active');
    await assert.rejects(restaurarRespaldo(source, join(dir, 'active.sqlite')), /WAL activo/);
    assert.ok(!(await readdir(dir)).some((name) => name.startsWith('.restore-')));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
