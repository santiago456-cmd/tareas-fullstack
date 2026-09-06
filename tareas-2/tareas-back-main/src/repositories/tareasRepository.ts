import type { Attributes, Order, Transactionable, WhereOptions } from 'sequelize';
import { paginacion, type Paginacion } from '../validation/paginacion.js';
import { Lista } from '../models/lista.js';
import { Tarea } from '../models/tarea.js';
import { BaseRepository } from './baseRepository.js';

export class TareasRepository extends BaseRepository<Tarea> {
  constructor() {
    super(Tarea);
  }

  async contarPorListaId(listaId: number) {
    return this.count({
      where: {
        listaId,
      },
    });
  }

  async contarPendientesPorListaId(listaId: number, options: Transactionable = {}) {
    return this.count({
      ...options,
      where: {
        listaId,
        completada: false,
      },
    });
  }

  async findAllPorCuentaId({
    cuentaId,
    where = {},
    order,
    pagination = paginacion(),
  }: {
    cuentaId: number;
    where?: WhereOptions<Attributes<Tarea>>;
    order?: Order;
    pagination?: Paginacion;
  }) {
    return Tarea.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      where,
      order,
      include: [{ model: Lista, as: 'lista', where: { cuentaId } }],
    });
  }

  async findByIdYCuentaId(id: number, cuentaId: number, options: Transactionable = {}) {
    return this.findOne({
      ...options,
      where: { id },
      include: [{ model: Lista, as: 'lista', where: { cuentaId } }],
    });
  }

  async obtenerPorListaIdYCuentaId(listaId: number, cuentaId: number, pagination = paginacion()) {
    return Tarea.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      where: { listaId },
      include: [{ model: Lista, as: 'lista', where: { cuentaId } }],
      order: [
        ['fechaCreacion', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  async eliminarCompletadasPorListaId(listaId: number, options: Transactionable = {}) {
    return Tarea.destroy({
      ...options,
      where: {
        listaId,
        completada: true,
      },
    });
  }
}
