import { Lista } from '../models/lista.js';
import { BaseRepository } from './baseRepository.js';

export class ListasRepository extends BaseRepository {
  constructor() {
    super(Lista);
  }

  async obtenerTodasOrdenadasPorNombrePorCuentaId(cuentaId) {
    return this.findAll({ where: { cuentaId }, order: [['nombre', 'ASC']] });
  }
  async obtenerPorIdYCuentaId(id, cuentaId, options = {}) {
    return this.findOne({ ...options, where: { id, cuentaId } });
  }
  async obtenerPorNombreYCuentaId(nombre, cuentaId, options = {}) {
    return Lista.findOne({ ...options, where: { nombre, cuentaId } });
  }

  async crear(datosLista, options = {}) {
    return this.create(datosLista, options);
  }

  async actualizar(lista, datosLista, options = {}) {
    return this.updateInstance(lista, datosLista, options);
  }

  async eliminar(lista, options = {}) {
    return this.deleteInstance(lista, options);
  }
}
