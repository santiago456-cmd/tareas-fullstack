import type { Transaction } from 'sequelize';
import { UniqueConstraintError } from 'sequelize';
import { withWriteTransaction } from '../config/transactions.js';
import type { Lista } from '../models/lista.js';
import { ListasRepository } from '../repositories/listasRepository.js';
import { TareasRepository } from '../repositories/tareasRepository.js';
import type { Failure, ListaView, ServiceResult, TareaView } from '../types/contracts.js';
import { HttpError } from '../utils/HttpError.js';
import { validarLista } from '../validation/recursos.js';

export class ListasService {
  private readonly listasRepository: ListasRepository;
  private readonly tareasRepository: TareasRepository;
  constructor({
    listasRepository = new ListasRepository(),
    tareasRepository = new TareasRepository(),
  } = {}) {
    this.listasRepository = listasRepository;
    this.tareasRepository = tareasRepository;
  }

  async obtenerListasConCantidadDeTareas(
    cuentaId: number,
    { incluirVacias = true } = {}
  ): Promise<Array<ListaView & { cantidadTareas: number }>> {
    const listas = await this.listasRepository.obtenerTodasOrdenadasPorNombrePorCuentaId(cuentaId);
    const resultado = [];
    for (const lista of listas) {
      const cantidadTareas = await this.tareasRepository.contarPorListaId(lista.id);
      if (!incluirVacias && cantidadTareas === 0) {
        continue;
      }
      resultado.push({
        id: lista.id,
        nombre: lista.nombre,
        descripcion: lista.descripcion,
        color: lista.color,
        fechaCreacion: lista.fechaCreacion,
        cantidadTareas,
      });
    }
    return resultado;
  }

  async obtenerListaPorId(cuentaId: number, id: number) {
    return this.listasRepository.obtenerPorIdYCuentaId(id, cuentaId);
  }

  async obtenerListaConTareas(
    cuentaId: number,
    id: number
  ): Promise<(ListaView & { tareas: TareaView[] }) | null> {
    const lista = await this.listasRepository.obtenerPorIdYCuentaId(id, cuentaId);
    if (!lista) {
      return null;
    }
    const tareas = await this.tareasRepository.obtenerPorListaIdYCuentaId(id, cuentaId);
    return {
      id: lista.id,
      nombre: lista.nombre,
      descripcion: lista.descripcion,
      color: lista.color,
      fechaCreacion: lista.fechaCreacion,
      tareas: tareas.map((tarea) => ({
        id: tarea.id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        completada: tarea.completada,
        prioridad: tarea.prioridad,
        fechaVencimiento: tarea.fechaVencimiento,
        fechaCreacion: tarea.fechaCreacion,
        etiquetas: tarea.etiquetas,
      })),
    };
  }

  async crearLista(cuentaId: number, datos: unknown): Promise<ServiceResult<Lista>> {
    const cambios = validarLista(datos);
    return this.escribirLista<ServiceResult<Lista>>(async (transaction) => {
      const existente = await this.listasRepository.obtenerPorNombreYCuentaId(
        cambios.nombre,
        cuentaId,
        { transaction }
      );
      if (existente)
        throw new HttpError(409, 'LISTA_DUPLICADA', 'Ya existe una lista con ese nombre');
      const lista = await this.listasRepository.crear(
        { descripcion: null, color: null, ...cambios, cuentaId },
        { transaction }
      );
      return { ok: true, status: 201, data: lista };
    });
  }

  async actualizarLista(
    cuentaId: number,
    id: number,
    datos: unknown
  ): Promise<ServiceResult<Lista>> {
    const cambios = validarLista(datos, { parcial: true });
    return this.escribirLista<ServiceResult<Lista>>(async (transaction) => {
      const lista = await this.listasRepository.obtenerPorIdYCuentaId(id, cuentaId, {
        transaction,
      });
      if (!lista) return this.noEncontrada();
      if (cambios.nombre !== undefined) {
        const existente = await this.listasRepository.obtenerPorNombreYCuentaId(
          cambios.nombre,
          cuentaId,
          { transaction }
        );
        if (existente && existente.id !== lista.id)
          throw new HttpError(409, 'LISTA_DUPLICADA', 'Ya existe otra lista con ese nombre');
      }
      const actualizada = await this.listasRepository.actualizar(lista, cambios, { transaction });
      return { ok: true, status: 200, data: actualizada };
    });
  }

  async eliminarLista(
    cuentaId: number,
    id: number
  ): Promise<ServiceResult<{ id: number; nombre: string }>> {
    return withWriteTransaction<ServiceResult<{ id: number; nombre: string }>>(
      async (transaction) => {
        const lista = await this.listasRepository.obtenerPorIdYCuentaId(id, cuentaId, {
          transaction,
        });
        if (!lista) return this.noEncontrada();
        const pendientes = await this.tareasRepository.contarPendientesPorListaId(id, {
          transaction,
        });
        if (pendientes > 0) {
          return {
            ok: false,
            status: 409,
            code: 'LISTA_CON_TAREAS_PENDIENTES',
            message: 'No se puede eliminar la lista porque tiene tareas pendientes',
            details: { id: lista.id, tareasPendientes: pendientes },
          };
        }
        await this.tareasRepository.eliminarCompletadasPorListaId(id, { transaction });
        await this.listasRepository.eliminar(lista, { transaction });
        return { ok: true, status: 200, data: { id: lista.id, nombre: lista.nombre } };
      }
    );
  }

  async escribirLista<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    try {
      return await withWriteTransaction(work);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new HttpError(409, 'LISTA_DUPLICADA', 'Ya existe una lista con ese nombre');
      }
      throw error;
    }
  }

  noEncontrada(): Failure {
    return {
      ok: false,
      status: 404,
      code: 'LISTA_NO_ENCONTRADA',
      message: 'La lista solicitada no existe',
    };
  }
}
