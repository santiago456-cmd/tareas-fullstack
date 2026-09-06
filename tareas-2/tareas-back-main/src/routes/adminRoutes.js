import { Router } from 'express';
import tokenExtractor from '../middlewares/tokenExtractor.js';
import { requiereRol } from '../middlewares/authorization.js';
import { AdminController } from '../controllers/adminController.js';

export const adminRoutes = Router();

adminRoutes.use(tokenExtractor);
adminRoutes.use(requiereRol('admin'));

adminRoutes.get('/cuentas', AdminController.listarCuentas);
adminRoutes.get('/listas', AdminController.listarListas);
