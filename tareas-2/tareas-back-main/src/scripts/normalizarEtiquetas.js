import '../models/associations.js';
import { prepararConexionSqlite, sequelize } from '../config/database.js';
import { normalizarEtiquetasGuardadas } from '../services/normalizarEtiquetasService.js';
import { crearRespaldo } from '../services/backupService.js';

try {
  const aplicar = process.argv.includes('--apply');
  const indiceRespaldo = process.argv.indexOf('--backup');
  const respaldo = indiceRespaldo >= 0 ? process.argv[indiceRespaldo + 1] : null;
  if (aplicar && (!respaldo || respaldo.startsWith('--'))) {
    throw new Error('Para aplicar indique --backup /ruta/respaldo-nuevo.sqlite');
  }
  await prepararConexionSqlite();
  if (aplicar) await crearRespaldo(respaldo);
  console.log(JSON.stringify(await normalizarEtiquetasGuardadas({ aplicar })));
} catch (error) {
  console.error('No se pudieron normalizar las etiquetas:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
