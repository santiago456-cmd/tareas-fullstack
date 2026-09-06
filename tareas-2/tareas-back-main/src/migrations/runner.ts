import { createHash } from 'node:crypto';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { migrations } from './definitions.js';

const checksum = (sql: readonly string[]) =>
  createHash('sha256').update(sql.join('\n')).digest('hex');
const options = (transaction?: Transaction) => ({ type: QueryTypes.SELECT as const, transaction });

export async function verificarIntegridad(db: Sequelize, transaction?: Transaction) {
  const integrity = await db.query<{ integrity_check: string }>(
    'PRAGMA integrity_check',
    options(transaction)
  );
  if (integrity.length !== 1 || integrity[0]?.integrity_check !== 'ok')
    throw new Error('Integridad SQLite inválida');
  if ((await db.query('PRAGMA foreign_key_check', options(transaction))).length)
    throw new Error('Referencias huérfanas en SQLite');
}

// Compara el esquema anterior con una copia de la definición congelada, nunca con modelos cambiantes.
async function verificarBaseline(db: Sequelize, transaction: Transaction) {
  const reference = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  try {
    for (const sql of migrations[0].sql) await reference.query(sql);
    for (const table of ['CUENTAS', 'LISTAS', 'TAREAS']) {
      for (const pragma of ['table_info', 'foreign_key_list']) {
        const actual = await db.query(`PRAGMA ${pragma}(${table})`, options(transaction));
        const expected = await reference.query(`PRAGMA ${pragma}(${table})`, options());
        // SQLite BOOL se representa como TINYINT(1); el orden de las columnas no cambia el contrato.
        const normalize = (rows: object[]) =>
          rows
            .map((row) => {
              const value = { ...row } as Record<string, unknown>;
              delete value.cid;
              delete value.id;
              delete value.seq;
              return JSON.stringify(Object.fromEntries(Object.entries(value).sort()));
            })
            .sort();
        if (JSON.stringify(normalize(actual)) !== JSON.stringify(normalize(expected)))
          throw new Error(
            `Esquema incompatible: ${table}/${pragma}; se requiere migración explícita`
          );
      }
    }
    const uniqueIndexes = await db.query<{ name: string; unique: number }>(
      'PRAGMA index_list(CUENTAS)',
      options(transaction)
    );
    let subUnique = false;
    for (const index of uniqueIndexes.filter((i) => i.unique)) {
      const cols = await db.query<{ name: string }>(
        `PRAGMA index_info(${db.getQueryInterface().quoteIdentifier(index.name)})`,
        options(transaction)
      );
      if (cols.length === 1 && cols[0]?.name === 'KEYCLOAK_SUB') subUnique = true;
    }
    if (!subUnique) throw new Error('Falta unicidad de KEYCLOAK_SUB');
    await verificarIntegridad(db, transaction);
  } finally {
    await reference.close();
  }
}

export async function migrar(db: Sequelize) {
  return db.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (transaction) => {
    await db.query(
      'CREATE TABLE IF NOT EXISTS SCHEMA_MIGRATIONS (name TEXT PRIMARY KEY NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)',
      { transaction }
    );
    const applied = await db.query<{ name: string; checksum: string }>(
      'SELECT name, checksum FROM SCHEMA_MIGRATIONS ORDER BY name',
      options(transaction)
    );
    for (const [i, row] of applied.entries()) {
      const migration = migrations[i];
      if (!migration || row.name !== migration.name || row.checksum !== checksum(migration.sql))
        throw new Error('Historial de migraciones incompatible');
    }
    const completed: string[] = [];
    for (const migration of migrations.slice(applied.length)) {
      if (migration.name === '001-baseline') {
        const tables = await db.query<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('CUENTAS','LISTAS','TAREAS')",
          options(transaction)
        );
        if (tables.length && tables.length !== 3)
          throw new Error('Esquema parcial: no se puede adoptar la base');
        if (tables.length) await verificarBaseline(db, transaction);
      }
      for (const sql of migration.sql) await db.query(sql, { transaction });
      await db.query(
        'INSERT INTO SCHEMA_MIGRATIONS(name, checksum, applied_at) VALUES (:name, :checksum, :date)',
        {
          replacements: {
            name: migration.name,
            checksum: checksum(migration.sql),
            date: new Date().toISOString(),
          },
          transaction,
        }
      );
      completed.push(migration.name);
    }
    await verificarBaseline(db, transaction);
    await verificarIndices(db, transaction);
    return completed;
  });
}

export async function verificarMigraciones(db: Sequelize) {
  const applied = await db.query<{ name: string; checksum: string }>(
    'SELECT name, checksum FROM SCHEMA_MIGRATIONS ORDER BY name',
    options()
  );
  if (
    applied.length !== migrations.length ||
    applied.some(
      (row, i) =>
        row.name !== migrations[i]?.name || row.checksum !== checksum(migrations[i]?.sql ?? [])
    )
  )
    throw new Error('Migraciones pendientes o incompatibles: ejecute pnpm run migrate-db');
}

async function verificarIndices(db: Sequelize, transaction?: Transaction) {
  for (const [table, name, unique, fields] of [
    ['LISTAS', 'UK_listas_cuenta_nombre', 1, ['ID_CUENTA', 'NOMBRE']],
    ['TAREAS', 'IX_tareas_lista_fecha_id', 0, ['ID_LISTA', 'FECHA_CREACION', 'ID_TAREA']],
    ['TAREAS', 'IX_tareas_lista_completada', 0, ['ID_LISTA', 'COMPLETADA']],
  ] as const) {
    const indexes = await db.query<{ name: string; unique: number; partial: number }>(
      `PRAGMA index_list(${table})`,
      options(transaction)
    );
    const index = indexes.find((i) => i.name === name);
    const cols = await db.query<{ name: string }>(
      `PRAGMA index_info(${name})`,
      options(transaction)
    );
    if (
      !index ||
      index.unique !== unique ||
      index.partial ||
      JSON.stringify(cols.map((c) => c.name)) !== JSON.stringify(fields)
    )
      throw new Error(`Índice incompatible: ${name}`);
  }
}
