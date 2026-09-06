import { constants } from 'node:fs';
import { chmod, copyFile, link, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { QueryTypes, Sequelize } from 'sequelize';
import { migrar, verificarIntegridad } from '../migrations/runner.js';

export async function restaurarRespaldo(origen?: string, destino?: string) {
  if (!origen || !destino) throw new Error('Uso: restore-db <respaldo.sqlite> <base-nueva.sqlite>');
  const source = resolve(origen),
    target = resolve(destino);
  if (source === target) throw new Error('El destino debe ser un archivo nuevo');
  if (!(await stat(source)).isFile()) throw new Error('El respaldo debe ser un archivo');
  for (const suffix of ['-wal', '-shm']) {
    if (
      await stat(source + suffix).then(
        () => true,
        (error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return false;
          throw error;
        }
      )
    )
      throw new Error('Use una instantánea de backup-db, no una base con WAL activo');
  }
  for (const suffix of ['-wal', '-shm']) {
    if (
      await stat(target + suffix).then(
        () => true,
        (error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return false;
          throw error;
        }
      )
    )
      throw new Error('El destino tiene archivos WAL/SHM existentes');
  }
  await mkdir(dirname(target), { recursive: true });
  const directory = await mkdtemp(join(dirname(target), '.restore-'));
  const temporary = join(directory, 'database.sqlite');
  let db: Sequelize | undefined;
  try {
    await copyFile(source, temporary, constants.COPYFILE_EXCL);
    await chmod(temporary, 0o600);
    db = new Sequelize({ dialect: 'sqlite', storage: temporary, logging: false });
    const tables = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('CUENTAS','LISTAS','TAREAS')",
      { type: QueryTypes.SELECT }
    );
    if (tables.length !== 3) throw new Error('El respaldo no contiene el esquema de tareas');
    await verificarIntegridad(db);
    await migrar(db);
    await db.close();
    db = undefined;
    // Publicación atómica y exclusiva: nunca sustituye una base existente.
    await link(temporary, target);
    return target;
  } finally {
    try {
      if (db) await db.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
