import type { Attributes, CreationAttributes, Transactionable } from 'sequelize';
import { Lista } from '../models/lista.js';
import { BaseRepository } from './baseRepository.js';

export class ListasRepository extends BaseRepository<Lista> {
  constructor() {
    super(Lista);
  }

  async obtenerTodasOrdenadasPorNombrePorCuentaId(cuentaId: number) {
    return this.findAll({ where: { cuentaId }, order: [['nombre', 'ASC']] });
  }
  async obtenerPorIdYCuentaId(id: number, cuentaId: number, options: Transactionable = {}) {
    return this.findOne({ ...options, where: { id, cuentaId } });
  }
  async obtenerPorNombreYCuentaId(nombre: string, cuentaId: number, options: Transactionable = {}) {
    return Lista.findOne({ ...options, where: { nombre, cuentaId } });
  }

  async crear(datosLista: CreationAttributes<Lista>, options: Transactionable = {}) {
    return this.create(datosLista, options);
  }

  async actualizar(
    lista: Lista,
    datosLista: Partial<Attributes<Lista>>,
    options: Transactionable = {}
  ) {
    return this.updateInstance(lista, datosLista, options);
  }

  async eliminar(lista: Lista, options: Transactionable = {}) {
    return this.deleteInstance(lista, options);
  }
}
