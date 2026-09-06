import { Router } from 'express';
import { healthCheckRoutes } from './healthCheckRoutes.js';
import { listasRoutes } from './listasRoutes.js';
import { tareasRoutes } from './tareasRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import { apiAutenticada } from '../middlewares/apiAutenticada.js';

export const apiRoutes = Router();

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
