import { prepararConexionSqlite, sequelize } from '../config/database.js';
import '../models/associations.js';

import { seedListas } from './seeders/listasSeeder.js';
import { seedTareas } from './seeders/tareasSeeder.js';

const force = process.argv.includes('--force');

async function main() {
  try {
    console.log('🔌 Verificando conexión con la base de datos...');

    await prepararConexionSqlite();
    console.log('✔ Conexión establecida');
    console.log(`🧱 Sincronizando modelos. force=${force}`);

    await sequelize.sync({ force });
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
