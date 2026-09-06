import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requiereRol } from '../middlewares/authorization.js';
import tokenExtractor from '../middlewares/tokenExtractor.js';

export const adminRoutes: Router = Router();

adminRoutes.use(tokenExtractor);
adminRoutes.use(requiereRol('admin'));

adminRoutes.get('/cuentas', AdminController.listarCuentas);
adminRoutes.get('/listas', AdminController.listarListas);
