import { Router } from 'express';
import { HealthCheckController } from '../controllers/healthCheckController.js';

export const healthCheckRoutes: Router = Router();

healthCheckRoutes.get('/', HealthCheckController.getHealthCheck);
