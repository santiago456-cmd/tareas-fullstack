import { Cuenta } from '../models/Cuenta.js';
import { Lista } from '../models/lista.js';
import { UniqueConstraintError } from 'sequelize';
import { withWriteTransaction } from '../config/transactions.js';

const LISTAS_BIENVENIDA = [
  { nombre: 'Personal', descripcion: 'Tareas personales', color: '#4CAF50' },
  { nombre: 'Trabajo', descripcion: 'Tareas laborales', color: '#2196F3' },
];

export class CuentasService {
  async resolverDesdeUsuario(user) {
    const keycloakSub = user?.id;
    if (!keycloakSub) {
      throw new Error('USER_INVALIDO');
    }
    // En disco las lecturas fuera de la transacción solo ven cuentas confirmadas.
    // :memory: comparte conexión y debe pasar por la cola para no leer altas a medias.
    if (Cuenta.sequelize.options.storage !== ':memory:') {
      const existente = await Cuenta.findOne({ where: { keycloakSub } });
      if (existente) return existente;
    }
    try {
      return await withWriteTransaction(async (transaction) => {
        let cuenta = await Cuenta.findOne({ where: { keycloakSub }, transaction });
        if (cuenta) return cuenta;
        cuenta = await Cuenta.create(
          {
            keycloakSub,
            username: user.username ?? 'sin-username',
            email: user.email ?? null,
          },
          { transaction }
        );
        for (const lista of LISTAS_BIENVENIDA) {
          await Lista.create({ ...lista, cuentaId: cuenta.id }, { transaction });
        }
        return cuenta;
      });
    } catch (error) {
      // Otra transacción puede haber creado la cuenta; consultar tras el rollback.
      if (error instanceof UniqueConstraintError) {
        const cuenta = await Cuenta.findOne({ where: { keycloakSub } });
        if (cuenta) return cuenta;
      }
      throw error;
    }
  }
}
