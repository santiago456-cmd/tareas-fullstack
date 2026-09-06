import { Router } from 'express';
import { TareasController } from '../controllers/TareasController.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';
import { apiAutenticada } from '../middlewares/apiAutenticada.js';

export const tareasRoutes = Router();

tareasRoutes.use(apiAutenticada);
tareasRoutes.get('/', TareasController.obtenerTareas);
tareasRoutes.get('/:id', validateIdParam('id'), TareasController.obtenerTareaPorId);
tareasRoutes.post('/', TareasController.crearTarea);
tareasRoutes.patch('/:id/completar', validateIdParam('id'), TareasController.completarTarea);
tareasRoutes.patch('/:id', validateIdParam('id'), TareasController.actualizarTarea);
tareasRoutes.delete('/:id', validateIdParam('id'), TareasController.eliminarTarea);
