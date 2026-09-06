import { Router } from 'express';
import { ListasController } from '../controllers/listasController.js';
import { validateIdParam } from '../middlewares/validateIdParam.js';
import { apiAutenticada } from '../middlewares/apiAutenticada.js';

export const listasRoutes = Router();

listasRoutes.use(apiAutenticada);
listasRoutes.get('/', ListasController.obtenerListas);
listasRoutes.get('/:id/tareas', validateIdParam('id'), ListasController.obtenerTareasDeLista);
listasRoutes.get('/:id', validateIdParam('id'), ListasController.obtenerListaPorId);
listasRoutes.post('/', ListasController.crearLista);
listasRoutes.patch('/:id', validateIdParam('id'), ListasController.actualizarLista);
listasRoutes.delete('/:id', validateIdParam('id'), ListasController.eliminarLista);
