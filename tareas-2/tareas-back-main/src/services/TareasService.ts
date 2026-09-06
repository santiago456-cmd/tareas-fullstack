import type { Attributes, WhereOptions } from 'sequelize';
import { withWriteTransaction } from '../config/transactions.js';
import type { Tarea } from '../models/tarea.js';
import { ListasRepository } from '../repositories/listasRepository.js';
import { TareasRepository } from '../repositories/tareasRepository.js';
import type { Failure, ServiceResult } from '../types/contracts.js';
import { validarTarea } from '../validation/recursos.js';

import { esPrioridad } from '../validation/recursos.js';

export class TareasService {
  private readonly listasRepository: ListasRepository;
  private readonly tareasRepository: TareasRepository;
  constructor({
    tareasRepository = new TareasRepository(),
    listasRepository = new ListasRepository(),
  } = {}) {
    this.tareasRepository = tareasRepository;
    this.listasRepository = listasRepository;
  }

  async obtenerTareas(
    cuentaId: number,
    { completada, prioridad }: { completada?: string; prioridad?: string } = {}
  ): Promise<ServiceResult<Tarea[]>> {
    const where: WhereOptions<Attributes<Tarea>> = {};

    if (completada !== undefined) {
      if (completada === 'true') {
        where.completada = true;
      } else if (completada === 'false') {
        where.completada = false;
      } else {
        return {
          ok: false,
          status: 400,
          code: 'TAREA_FILTRO_INVALIDO',
          message: 'El filtro completada debe ser true o false',
        };
      }
    }

    if (prioridad !== undefined) {
      if (!esPrioridad(prioridad)) {
        return {
          ok: false,
          status: 400,
          code: 'TAREA_PRIORIDAD_INVALIDA',
          message: 'La prioridad debe ser baja, media o alta',
        };
      }
      where.prioridad = prioridad;
    }

    const tareas = await this.tareasRepository.findAllPorCuentaId({
      cuentaId,
      where,
      order: [['fechaCreacion', 'ASC']],
    });

    return { ok: true, status: 200, data: tareas };
  }

  async obtenerTareaPorId(cuentaId: number, id: number) {
    return this.tareasRepository.findByIdYCuentaId(id, cuentaId);
  }

  async crearTarea(cuentaId: number, datos: unknown): Promise<ServiceResult<Tarea>> {
    const valores = validarTarea(datos);
    return withWriteTransaction<ServiceResult<Tarea>>(async (transaction) => {
      const lista = await this.listasRepository.obtenerPorIdYCuentaId(valores.listaId, cuentaId, {
        transaction,
      });
      if (!lista)
        return {
          ok: false,
          status: 404,
          code: 'LISTA_NO_ENCONTRADA',
          message: 'La lista especificada no existe',
        };
      const tarea = await this.tareasRepository.create(
        { descripcion: null, fechaVencimiento: null, etiquetas: [], ...valores },
        { transaction }
      );
      return { ok: true, status: 201, data: tarea };
    });
  }

  async actualizarTarea(
    cuentaId: number,
    id: number,
    datos: unknown
  ): Promise<ServiceResult<Tarea>> {
    const cambios = validarTarea(datos, { parcial: true });
    return withWriteTransaction<ServiceResult<Tarea>>(async (transaction) => {
      const tarea = await this.tareasRepository.findByIdYCuentaId(id, cuentaId, { transaction });
      if (!tarea) return this.noEncontrada();
      const actualizada = await this.tareasRepository.updateInstance(tarea, cambios, {
        transaction,
      });
      return { ok: true, status: 200, data: actualizada };
    });
  }

  async completarTarea(cuentaId: number, id: number): Promise<ServiceResult<Tarea>> {
    return withWriteTransaction<ServiceResult<Tarea>>(async (transaction) => {
      const tarea = await this.tareasRepository.findByIdYCuentaId(id, cuentaId, { transaction });
      if (!tarea) return this.noEncontrada();
      if (tarea.completada)
        return {
          ok: false,
          status: 409,
          code: 'TAREA_YA_COMPLETADA',
          message: 'La tarea ya fue completada anteriormente',
        };
      const completada = await this.tareasRepository.updateInstance(
        tarea,
        { completada: true },
        { transaction }
      );
      return { ok: true, status: 200, data: completada };
    });
  }

  async eliminarTarea(
    cuentaId: number,
    id: number
  ): Promise<ServiceResult<{ id: number; titulo: string }>> {
    return withWriteTransaction<ServiceResult<{ id: number; titulo: string }>>(
      async (transaction) => {
        const tarea = await this.tareasRepository.findByIdYCuentaId(id, cuentaId, { transaction });
        if (!tarea) return this.noEncontrada();
        await this.tareasRepository.deleteInstance(tarea, { transaction });
        return { ok: true, status: 200, data: { id: tarea.id, titulo: tarea.titulo } };
      }
    );
  }

  noEncontrada(): Failure {
    return {
      ok: false,
      status: 404,
      code: 'TAREA_NO_ENCONTRADA',
      message: 'La tarea solicitada no existe',
    };
  }
}
