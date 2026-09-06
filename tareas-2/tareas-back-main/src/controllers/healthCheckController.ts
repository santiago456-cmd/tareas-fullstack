import { HealthCheckService } from '../services/healthCheckService.js';
import { type ApiRequest, type ApiRes } from '../types/http.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

/**
 * @openapi
 * /api/health-check:
 *   get:
 *     summary: Verifica el estado de la API
 *     description: Devuelve información general sobre el estado de la aplicación, configuración, runtime y disponibilidad inicial.
 *     tags:
 *       - Health Check
 *     responses:
 *       503:
 *         description: API no disponible porque la base de datos no responde
 *       200:
 *         description: API funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API funcionando correctamente
 *                 data:
 *                   type: object
 *                 meta:
 *                   type: object
 *                 error:
 *                   nullable: true
 */
export class HealthCheckController {
  static async getHealthCheck(req: ApiRequest, res: ApiRes) {
    const status = await HealthCheckService.getStatus();
    res.set('Cache-Control', 'no-store');
    if (status.checks.database !== 'OK') {
      return res.status(503).json(
        errorResponse({
          message: 'La base de datos no está disponible',
          code: 'SERVICIO_NO_DISPONIBLE',
          details: { status: status.status, checks: status.checks },
        })
      );
    }
    return res.status(200).json(
      successResponse({
        message: 'API funcionando correctamente',
        data: status,
        meta: {
          endpoint: '/api/health-check',
        },
      })
    );
  }
}
