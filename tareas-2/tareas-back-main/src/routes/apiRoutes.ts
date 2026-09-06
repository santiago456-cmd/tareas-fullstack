import { Router } from 'express';
import { apiAutenticada } from '../middlewares/apiAutenticada.js';
import { adminRoutes } from './adminRoutes.js';
import { healthCheckRoutes } from './healthCheckRoutes.js';
import { listasRoutes } from './listasRoutes.js';
import { tareasRoutes } from './tareasRoutes.js';

export const apiRoutes: Router = Router();

apiRoutes.use('/health-check', healthCheckRoutes);

apiRoutes.get('/me', ...apiAutenticada, (req, res) => {
  res.json({
    user: req.user,
    cuenta: req.cuenta,
  });
});

apiRoutes.use('/admin', adminRoutes);
apiRoutes.use('/listas', listasRoutes);
apiRoutes.use('/tareas', tareasRoutes);
