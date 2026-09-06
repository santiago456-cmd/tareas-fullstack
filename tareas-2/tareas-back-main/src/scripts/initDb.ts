import { prepararConexionSqlite, sequelize } from '../config/database.js';
import '../models/associations.js';
import { migrar } from '../migrations/runner.js';

import { seedListas } from './seeders/listasSeeder.js';
import { seedTareas } from './seeders/tareasSeeder.js';

const force = process.argv.includes('--force');

async function main() {
  try {
    console.log('🔌 Verificando conexión con la base de datos...');

    await prepararConexionSqlite();
    console.log('✔ Conexión establecida');
    console.log(`🧱 Aplicando migraciones. force=${force}`);

    if (force) {
      await sequelize.drop();
      await sequelize.query('DROP TABLE IF EXISTS SCHEMA_MIGRATIONS');
    }
    await migrar(sequelize);
    console.log('🌱 Insertando datos iniciales...');

    await seedListas();
    await seedTareas();
    console.log('🟢 Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch (error) {
      console.error('Error al cerrar la conexión:', error);
      process.exitCode = 1;
    }
  }
}

main();
