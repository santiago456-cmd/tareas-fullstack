import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env.js';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Tareas',
      version: '1.0.0',
      description: 'Documentación inicial de la API de tareas.',
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Servidor local de desarrollo',
      },
    ],
  },
  apis: ['./src/controllers/*.js'],
});
