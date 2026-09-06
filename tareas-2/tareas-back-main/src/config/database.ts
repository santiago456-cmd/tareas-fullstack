import 'dotenv/config';
import { dirname, resolve } from 'node:path';
import { QueryTypes, Sequelize } from 'sequelize';

export const storage = process.env.SQLITE_STORAGE || './data/db.sqlite';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

export async function prepararConexionSqlite() {
  if (storage !== ':memory:')
    await import('node:fs/promises').then(({ mkdir }) =>
      mkdir(dirname(resolve(storage)), { recursive: true })
    );
  await sequelize.authenticate();
  if (storage !== ':memory:') {
    const resultados = await sequelize.query<{ journal_mode: string }>(
      'PRAGMA journal_mode = WAL',
      { type: QueryTypes.SELECT }
    );
    if (resultados[0]?.journal_mode !== 'wal') throw new Error('No se pudo activar WAL en SQLite');
  }
  await sequelize.query('PRAGMA synchronous = FULL');
}
