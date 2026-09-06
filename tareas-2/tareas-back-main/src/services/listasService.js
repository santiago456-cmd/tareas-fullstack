import { UniqueConstraintError } from 'sequelize';
import { withWriteTransaction } from '../config/transactions.js';
import { validarLista } from '../validation/recursos.js';
import { HttpError } from '../utils/HttpError.js';
import { ListasRepository } from '../repositories/listasRepository.js';
import { TareasRepository } from '../repositories/tareasRepository.js';

export class ListasService {
  constructor({
    listasRepository = new ListasRepository(),
    tareasRepository = new TareasRepository(),
  } = {}) {
    this.listasRepository = listasRepository;
    this.tareasRepository = tareasRepository;
  }

  async obtenerListasConCantidadDeTareas(cuentaId, { incluirVacias = true } = {}) {
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

  async obtenerListaPorId(cuentaId, id) {
    return this.listasRepository.obtenerPorIdYCuentaId(id, cuentaId);
  }

  async obtenerListaConTareas(cuentaId, id) {
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

  async crearLista(cuentaId, datos) {
    const cambios = validarLista(datos);
    return this.escribirLista(async (transaction) => {
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

  async actualizarLista(cuentaId, id, datos) {
    const cambios = validarLista(datos, { parcial: true });
    return this.escribirLista(async (transaction) => {
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

  async eliminarLista(cuentaId, id) {
    return withWriteTransaction(async (transaction) => {
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
    });
  }

  async escribirLista(work) {
    try {
      return await withWriteTransaction(work);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new HttpError(409, 'LISTA_DUPLICADA', 'Ya existe una lista con ese nombre');
      }
      throw error;
    }
  }

  noEncontrada() {
    return {
      ok: false,
      status: 404,
      code: 'LISTA_NO_ENCONTRADA',
      message: 'La lista solicitada no existe',
    };
  }
}
