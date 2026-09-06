import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { corsMiddleware } from './middlewares/corsMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundMiddleware } from './middlewares/notFoundMiddleware.js';
import { requestLogger } from './middlewares/requestLogger.js';
import './models/associations.js';
import { apiRoutes } from './routes/apiRoutes.js';
import { authRoutes } from './routes/authRoutes.js';

export function createApp(): express.Express {
  const app = express();

  app.use(requestLogger);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(authRoutes);
  app.use('/api', apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
