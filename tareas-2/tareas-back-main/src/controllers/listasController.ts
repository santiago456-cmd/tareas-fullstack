import { paginacion } from '../validation/paginacion.js';
import type { NextFunction } from 'express';
import { ListasService } from '../services/listasService.js';
import {
  cuentaId as obtenerCuentaId,
  parametroId,
  type ApiRequest,
  type ApiRes,
} from '../types/http.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';
import { validarQuery } from '../validation/recursos.js';

const listasService = new ListasService();

/**
 * @openapi
 * tags:
 *   - name: Listas
 *     description: Operaciones relacionadas con listas de tareas
 */
/**
 * ListasController
 *
 * Esta clase contiene handlers HTTP para el recurso listas.
 */
export class ListasController {
  /**
   * @openapi
   * /api/listas:
   *   get:
   *     summary: Obtener todas las listas
   *     description: Devuelve una página de listas con conteos. meta contiene page, limit, total, totalPages y hasNextPage. El filtro de listas vacías se aplica antes de paginar.
   *     tags:
   *       - Listas
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 1000000
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 50
   *       - in: query
   *         name: incluirVacias
   *         schema:
   *           type: boolean
   *         required: false
   *         description: Si es false, no devuelve listas sin tareas
   *     responses:
   *       '200':
   *         description: Listas obtenidas correctamente
   *       '500':
   *         description: Error interno del servidor
   */
  static async obtenerListas(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      validarQuery(req.query, ['incluirVacias', 'page', 'limit']);
      const incluirVacias = req.query.incluirVacias !== 'false';
      const cuentaId = obtenerCuentaId(req);
      const listas = await listasService.obtenerListasConCantidadDeTareas(cuentaId, {
        incluirVacias,
        pagination: paginacion(req.query),
      });
      return res.status(200).json(
        successResponse({
          message: 'Listas obtenidas correctamente',
          data: listas.data,
          meta: {
            ...listas.meta,
            incluirVacias,
          },
        })
      );
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @openapi
   * /api/listas/{id}:
   *   get:
   *     summary: Obtener una lista por ID
   *     description: Devuelve una lista específica a partir de su identificador
   *     tags:
   *       - Listas
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Identificador de la lista
   *     responses:
   *       '200':
   *         description: Lista obtenida correctamente
   *       '400':
   *         description: ID inválido
   *       '404':
   *         description: Lista no encontrada
   *       '500':
   *         description: Error interno del servidor
   */
  static async obtenerListaPorId(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de lista debe ser un entero positivo',
            code: 'LISTA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      const lista = await listasService.obtenerListaPorId(cuentaId, id);
      if (!lista) {
        return res.status(404).json(
          errorResponse({
            message: 'La lista solicitada no existe',
            code: 'LISTA_NO_ENCONTRADA',
            details: { id },
          })
        );
      }
      return res.status(200).json(
        successResponse({
          message: 'Lista obtenida correctamente',
          data: lista,
          meta: null,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @openapi
   * /api/listas/{id}/tareas:
   *   get:
   *     summary: Obtener tareas de una lista
   *     description: Devuelve la lista con una página de tareas. meta incluye page, limit, total, totalTareas, totalPages y hasNextPage.
   *     tags:
   *       - Listas
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 1000000
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 50
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Identificador de la lista
   *     responses:
   *       '200':
   *         description: Tareas obtenidas correctamente
   *       '400':
   *         description: ID inválido
   *       '404':
   *         description: Lista no encontrada
   *       '500':
   *         description: Error interno del servidor
   */
  static async obtenerTareasDeLista(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de lista debe ser un entero positivo',
            code: 'LISTA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      validarQuery(req.query, ['page', 'limit']);
      const listaConTareas = await listasService.obtenerListaConTareas(
        cuentaId,
        id,
        paginacion(req.query)
      );
      if (!listaConTareas) {
        return res.status(404).json(
          errorResponse({
            message: 'La lista solicitada no existe',
            code: 'LISTA_NO_ENCONTRADA',
            details: { id },
          })
        );
      }
      return res.status(200).json(
        successResponse({
          message: 'Tareas de la lista obtenidas correctamente',
          data: listaConTareas.data,
          meta: {
            ...listaConTareas.meta,
            totalTareas: listaConTareas.meta.total,
          },
        })
      );
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @openapi
   * /api/listas:
   *   post:
   *     summary: Crear una nueva lista
   *     description: Permite registrar una nueva lista de tareas
   *     tags:
   *       - Listas
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *             properties:
   *               nombre:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               color:
   *                 type: string
   *     responses:
   *       '201':
   *         description: Lista creada correctamente
   *       '400':
   *         description: Datos inválidos
   *       '409':
   *         description: Lista duplicada
   *       '500':
   *         description: Error interno del servidor
   */
  static async crearLista(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const cuentaId = obtenerCuentaId(req);
      const resultado = await listasService.crearLista(cuentaId, req.body);
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
          message: 'Lista creada correctamente',
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
   * /api/listas/{id}:
   *   patch:
   *     summary: Actualizar una lista
   *     description: Permite modificar parcialmente una lista existente
   *     tags:
   *       - Listas
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
   *     responses:
   *       '200':
   *         description: Lista actualizada correctamente
   *       '400':
   *         description: Datos inválidos
   *       '404':
   *         description: Lista no encontrada
   *       '409':
   *         description: Conflicto de datos
   *       '500':
   *         description: Error interno del servidor
   */
  static async actualizarLista(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de lista debe ser un entero positivo',
            code: 'LISTA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      const resultado = await listasService.actualizarLista(cuentaId, id, req.body);
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
          message: 'Lista actualizada correctamente',
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
   * /api/listas/{id}:
   *   delete:
   *     summary: Eliminar una lista
   *     description: Elimina una lista solo si no tiene tareas pendientes
   *     tags:
   *       - Listas
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Lista eliminada correctamente
   *       '400':
   *         description: ID inválido
   *       '404':
   *         description: Lista no encontrada
   *       '409':
   *         description: No se puede eliminar por reglas de negocio
   *       '500':
   *         description: Error interno del servidor
   */
  static async eliminarLista(req: ApiRequest, res: ApiRes, next: NextFunction) {
    try {
      const id = parametroId(req);
      const cuentaId = obtenerCuentaId(req);
      if (!id) {
        return res.status(400).json(
          errorResponse({
            message: 'El id de lista debe ser un entero positivo',
            code: 'LISTA_ID_INVALIDO',
            details: { id: req.params.id },
          })
        );
      }
      const resultado = await listasService.eliminarLista(cuentaId, id);
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
          message: 'Lista eliminada correctamente',
          data: resultado.data,
          meta: null,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
}
