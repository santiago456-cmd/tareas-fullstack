import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Sequelize } from 'sequelize';

const storage = process.env.SQLITE_STORAGE || './data/db.sqlite';

if (storage !== ':memory:') {
  mkdirSync(dirname(resolve(storage)), { recursive: true });
}

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

export async function prepararConexionSqlite() {
  await sequelize.authenticate();
  if (storage !== ':memory:') {
    const [resultados] = await sequelize.query('PRAGMA journal_mode = WAL');
    if (resultados[0]?.journal_mode !== 'wal') throw new Error('No se pudo activar WAL en SQLite');
  }
  await sequelize.query('PRAGMA synchronous = FULL');
}
