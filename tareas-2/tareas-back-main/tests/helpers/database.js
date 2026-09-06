import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function testDatabase() {
  const directory = await mkdtemp(join(tmpdir(), 'tareas-test-'));
  process.env.SQLITE_STORAGE = join(directory, 'test.sqlite');
  process.env.NODE_ENV = 'test';
  const { sequelize, prepararConexionSqlite } = await import('../../src/config/database.js');
  await import('../../src/models/associations.js');
  await prepararConexionSqlite();
  return {
    sequelize,
    directory,
    reset: () => sequelize.sync({ force: true }),
    close: async () => {
      await sequelize.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}
