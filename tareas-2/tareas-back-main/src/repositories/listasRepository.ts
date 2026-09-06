import type { Attributes, CreationAttributes, Transactionable } from 'sequelize';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import type { ListaView } from '../types/contracts.js';
import { paginacion, pageMeta, type Paginacion } from '../validation/paginacion.js';
import { Lista } from '../models/lista.js';
import { BaseRepository } from './baseRepository.js';

export class ListasRepository extends BaseRepository<Lista> {
  constructor() {
    super(Lista);
  }

  async paginaConConteos(cuentaId: number, incluirVacias = true, p: Paginacion = paginacion()) {
    const filtro = incluirVacias
      ? ''
      : 'AND EXISTS (SELECT 1 FROM TAREAS t WHERE t.ID_LISTA = l.ID_LISTA)';
    const replacements = { cuentaId, limit: p.limit, offset: p.offset };
    const totals = await sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM LISTAS l WHERE l.ID_CUENTA = :cuentaId ${filtro}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const data = await sequelize.query<
      Omit<ListaView, 'fechaCreacion'> & { fechaCreacion: string; cantidadTareas: number }
    >(
      `SELECT l.ID_LISTA AS id, l.NOMBRE AS nombre, l.DESCRIPCION AS descripcion,
       l.COLOR AS color, l.FECHA_CREACION AS fechaCreacion,
       (SELECT COUNT(*) FROM TAREAS t WHERE t.ID_LISTA = l.ID_LISTA) AS cantidadTareas
       FROM LISTAS l WHERE l.ID_CUENTA = :cuentaId ${filtro}
       ORDER BY l.NOMBRE ASC, l.ID_LISTA ASC LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );
    return {
      data: data.map((row) => ({ ...row, fechaCreacion: new Date(row.fechaCreacion) })),
      meta: pageMeta(totals[0]?.total ?? 0, p),
    };
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
