import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { sequelize } from '../config/database.js';

export async function crearRespaldo(destino) {
  if (!destino) throw new Error('Indique el archivo de destino del respaldo');
  const archivo = resolve(destino);
  if (archivo === resolve(sequelize.options.storage))
    throw new Error('El destino debe ser distinto de la base activa');
  await mkdir(dirname(archivo), { recursive: true });
  // VACUUM INTO produce una instantánea consistente, incluyendo datos en WAL.
  // SQLite rechaza un destino existente no vacío; nunca copiamos solo el .sqlite activo.
  await sequelize.query('VACUUM INTO :archivo', { replacements: { archivo } });
  return archivo;
}
