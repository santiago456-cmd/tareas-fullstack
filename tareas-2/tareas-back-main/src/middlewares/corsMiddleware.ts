import cors from 'cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
  origin: env.corsOrigin,
  exposedHeaders: ['X-Request-Id'],
});
