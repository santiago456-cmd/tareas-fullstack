import { prepararConexionSqlite, sequelize } from '../config/database.js';
import { crearRespaldo } from '../services/backupService.js';

try {
  await prepararConexionSqlite();
  console.log(`Respaldo creado: ${await crearRespaldo(process.argv[2])}`);
} catch (error) {
  console.error('No se pudo crear el respaldo:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
