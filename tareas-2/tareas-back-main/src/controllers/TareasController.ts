import type { NextFunction } from 'express';
import { TareasService } from '../services/TareasService.js';
import {
  cuentaId as obtenerCuentaId,
  parametroId,
  type ApiRequest,
  type ApiRes,
} from '../types/http.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';
import { validarQuery } from '../validation/recursos.js';

const tareasService = new TareasService();

/**
 * @openapi
 * tags:
 *   - name: Tareas
 *     description: Operaciones relacionadas con tareas
 */
/**
 * TareasController
 *
 * Esta clase contiene handlers HTTP para el recurso tareas.
 */
export class TareasController {
  /**
   * @openapi
   * /api/tareas:
   *   get:
   *     summary: Obtener todas las tareas
   *     description: Devuelve todas las tareas. Permite filtrar por estado de completado y prioridad.
   *     tags:
   *       - Tareas
   *     parameters:
   *       - in: query
   *         name: completada
   *         schema:
   *           type: boolean
   *         required: false
   *         description: Filtra por estado de completado (true o false)
   *       - in: query
   *         name: prioridad
   *         schema:
   *           type: string
   *           enum: [baja, media, alta]
   *         required: false
   *         description: Filtra por nivel de prioridad
   *     responses:
   *       '200':
   *         description: Tareas obtenidas correctamente
   *       '400':
   *         description: Filtros inválidos
   *       '500':
   *         description: Error interno del servidor
   */
  static async obtenerTareas(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const { completada, prioridad } = validarQuery(req.query, ['completada', 'prioridad']);
      const cuentaId = obtenerCuentaId(req);
      const resultado = await tareasService.obtenerTareas(cuentaId, { completada, prioridad });
      if (!resultado.ok) {
        return res.status(resultado.status).json(
          errorResponse({
            message: resultado.message,
            code: resultado.code,
            details: resultado.details ?? null,
          })
        );
      }
      return res.status(200).json(
        successResponse({
          message: 'Tareas obtenidas correctamente',
          data: resultado.data,
          meta: {
            total: resultado.data.length,
          },
        })
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @openapi
   * /api/tareas/{id}:
   *   get:
   *     summary: Obtener una tarea por ID
   *     description: Devuelve una tarea específica a partir de su identificador
   *     tags:
   *       - Tareas
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Identificador de la tarea
   *     responses:
   *       '200':
   *         description: Tarea obtenida correctamente
   *       '400':
   *         description: ID inválido
   *       '404':
   *         description: Tarea no encontrada
   *       '500':
   *         description: Error interno del servidor
   */
  static async obtenerTareaPorId(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de tarea debe ser un entero positivo',
            code: 'TAREA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      const tarea = await tareasService.obtenerTareaPorId(cuentaId, id);
      if (!tarea) {
        return res.status(404).json(
          errorResponse({
            message: 'La tarea solicitada no existe',
            code: 'TAREA_NO_ENCONTRADA',
            details: { id },
          })
        );
      }
      return res.status(200).json(
        successResponse({
          message: 'Tarea obtenida correctamente',
          data: tarea,
          meta: null,
        })
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @openapi
   * /api/tareas:
   *   post:
   *     summary: Crear una nueva tarea
   *     description: Permite registrar una nueva tarea asociada a una lista existente
   *     tags:
   *       - Tareas
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - titulo
   *               - listaId
   *             properties:
   *               titulo:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               prioridad:
   *                 type: string
   *                 enum: [baja, media, alta]
   *               fechaVencimiento:
   *                 type: string
   *                 format: date
   *               etiquetas:
   *                 type: array
   *                 items:
   *                   type: string
   *               listaId:
   *                 type: integer
   *     responses:
   *       '201':
   *         description: Tarea creada correctamente
   *       '400':
   *         description: Datos inválidos
   *       '404':
   *         description: Lista no encontrada
   *       '500':
   *         description: Error interno del servidor
   */
  static async crearTarea(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const cuentaId = obtenerCuentaId(req);
      const resultado = await tareasService.crearTarea(cuentaId, req.body);
      if (!resultado.ok) {
        return res.status(resultado.status).json(
          errorResponse({
            message: resultado.message,
            code: resultado.code,
            details: resultado.details ?? null,
          })
        );
      }
      return res.status(201).json(
        successResponse({
          message: 'Tarea creada correctamente',
          data: resultado.data,
          meta: null,
        })
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @openapi
   * /api/tareas/{id}:
   *   patch:
   *     summary: Actualizar una tarea
   *     description: Permite modificar parcialmente una tarea existente
   *     tags:
   *       - Tareas
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               titulo:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               prioridad:
   *                 type: string
   *                 enum: [baja, media, alta]
   *               fechaVencimiento:
   *                 type: string
   *                 format: date
   *               etiquetas:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       '200':
   *         description: Tarea actualizada correctamente
   *       '400':
   *         description: Datos inválidos
   *       '404':
   *         description: Tarea no encontrada
   *       '500':
   *         description: Error interno del servidor
   */
  static async actualizarTarea(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de tarea debe ser un entero positivo',
            code: 'TAREA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      const resultado = await tareasService.actualizarTarea(cuentaId, id, req.body);
      if (!resultado.ok) {
        return res.status(resultado.status).json(
          errorResponse({
            message: resultado.message,
            code: resultado.code,
            details: resultado.details ?? null,
          })
        );
      }
      return res.status(200).json(
        successResponse({
          message: 'Tarea actualizada correctamente',
          data: resultado.data,
          meta: null,
        })
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @openapi
   * /api/tareas/{id}/completar:
   *   patch:
   *     summary: Completar una tarea
   *     description: Marca una tarea como completada. Devuelve error si ya estaba completada.
   *     tags:
   *       - Tareas
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Identificador de la tarea
   *     responses:
   *       '200':
   *         description: Tarea completada correctamente
   *       '400':
   *         description: ID inválido
   *       '404':
   *         description: Tarea no encontrada
   *       '409':
   *         description: La tarea ya fue completada anteriormente
   *       '500':
   *         description: Error interno del servidor
   */
  static async completarTarea(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de tarea debe ser un entero positivo',
            code: 'TAREA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      const resultado = await tareasService.completarTarea(cuentaId, id);
      if (!resultado.ok) {
        return res.status(resultado.status).json(
          errorResponse({
            message: resultado.message,
            code: resultado.code,
            details: resultado.details ?? null,
          })
        );
      }
      return res.status(200).json(
        successResponse({
          message: 'Tarea completada correctamente',
          data: resultado.data,
          meta: null,
        })
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @openapi
   * /api/tareas/{id}:
   *   delete:
   *     summary: Eliminar una tarea
   *     description: Elimina una tarea existente por su identificador
   *     tags:
   *       - Tareas
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Identificador de la tarea
   *     responses:
   *       '200':
   *         description: Tarea eliminada correctamente
   *       '400':
   *         description: ID inválido
   *       '404':
   *         description: Tarea no encontrada
   *       '500':
   *         description: Error interno del servidor
   */
  static async eliminarTarea(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de tarea debe ser un entero positivo',
            code: 'TAREA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      const resultado = await tareasService.eliminarTarea(cuentaId, id);
      if (!resultado.ok) {
        return res.status(resultado.status).json(
          errorResponse({
            message: resultado.message,
            code: resultado.code,
            details: resultado.details ?? null,
          })
        );
      }
      return res.status(200).json(
        successResponse({
          message: 'Tarea eliminada correctamente',
          data: resultado.data,
          meta: null,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
}
