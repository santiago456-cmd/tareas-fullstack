import { Transaction } from 'sequelize';
import { sequelize } from './database.js';

let ultimaEscritura: Promise<unknown> = Promise.resolve();

export function withWriteTransaction<T>(
  work: (transaction: Transaction) => Promise<T>
): Promise<T> {
  if (sequelize.getDialect() !== 'sqlite') return sequelize.transaction(work);
  // SQLite tiene un escritor. La cola evita transacciones superpuestas en la
  // conexión :memory:; IMMEDIATE también protege frente a otros procesos.
  const resultado = ultimaEscritura.then(() =>
    sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, work)
  );
  ultimaEscritura = resultado.catch(() => {});
  return resultado;
}
