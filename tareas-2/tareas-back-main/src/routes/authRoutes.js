import { Router } from 'express';

export const authRoutes = Router();
authRoutes.get('/', (req, res) => {
  res.json({
    name: 'api-tareas',
    message: 'Inicie sesión desde el frontend. La API acepta Bearer tokens dirigidos a tareas-api.',
  });
});
