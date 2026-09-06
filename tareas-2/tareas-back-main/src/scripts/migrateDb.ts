import { prepararConexionSqlite, sequelize } from '../config/database.js';
import { migrar } from '../migrations/runner.js';
try {
  await prepararConexionSqlite();
  console.log({ migraciones: await migrar(sequelize) });
} catch (error) {
  console.error('Error al migrar:', error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
