import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'api-tareas-base',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  keycloak: {
    baseUrl: process.env.KEYCLOAK_BASE_URL,
    realm: process.env.KEYCLOAK_REALM,
    audience: process.env.KEYCLOAK_AUDIENCE || 'tareas-api',
  },
};
