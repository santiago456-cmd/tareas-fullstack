import { Tarea } from '../models/tarea.js';
import { withWriteTransaction } from '../config/transactions.js';
import { normalizarEtiquetas } from '../validation/recursos.js';
import { Op } from 'sequelize';

export async function normalizarEtiquetasGuardadas({ aplicar = false } = {}) {
  return withWriteTransaction(async (transaction) => {
    let revisadas = 0;
    let modificadas = 0;
    let ultimoId = 0;
    // Lotes acotados: la misma transacción mantiene una vista consistente.
    while (true) {
      const tareas = await Tarea.findAll({
        where: { id: { [Op.gt]: ultimoId } },
        order: [['id', 'ASC']],
        limit: 200,
        transaction,
      });
      if (tareas.length === 0) break;
      for (const tarea of tareas) {
        revisadas++;
        ultimoId = tarea.id;
        const raw = tarea.getDataValue('etiquetas');
        let valor;
        try {
          valor = JSON.parse(raw);
        } catch {
          valor = [];
        }
        const etiquetas = normalizarEtiquetas(valor);
        if (raw === JSON.stringify(etiquetas)) continue;
        modificadas++;
        if (aplicar) await tarea.update({ etiquetas }, { transaction });
      }
    }
    return { revisadas, modificadas, aplicado: aplicar };
  });
}
