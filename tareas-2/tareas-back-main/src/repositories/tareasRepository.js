import { Tarea } from '../models/tarea.js';
import { Lista } from '../models/lista.js';
import { BaseRepository } from './baseRepository.js';

export class TareasRepository extends BaseRepository {
  constructor() {
    super(Tarea);
  }

  async contarPorListaId(listaId) {
    return this.count({
      where: {
        listaId,
      },
    });
  }

  async contarPendientesPorListaId(listaId, options = {}) {
    return this.count({
      ...options,
      where: {
        listaId,
        completada: false,
      },
    });
  }

  async obtenerPorListaId(listaId) {
    return this.findAll({
      where: {
        listaId,
      },
      order: [['fechaCreacion', 'ASC']],
    });
  }

  async findAllPorCuentaId({ cuentaId, where = {}, order } = {}) {
    return this.findAll({
      where,
      order,
      include: [{ model: Lista, as: 'lista', where: { cuentaId } }],
    });
  }

  async findByIdYCuentaId(id, cuentaId, options = {}) {
    return this.findOne({
      ...options,
      where: { id },
      include: [{ model: Lista, as: 'lista', where: { cuentaId } }],
    });
  }

  async obtenerPorListaIdYCuentaId(listaId, cuentaId) {
    return this.findAll({
      where: { listaId },
      include: [{ model: Lista, as: 'lista', where: { cuentaId } }],
      order: [['fechaCreacion', 'ASC']],
    });
  }

  async eliminarCompletadasPorListaId(listaId, options = {}) {
    return Tarea.destroy({
      ...options,
      where: {
        listaId,
        completada: true,
      },
    });
  }
}
