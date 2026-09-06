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

export function validarEntorno() {
  if (
    process.env.PORT !== undefined &&
    (!/^\d+$/.test(process.env.PORT) ||
      Number(process.env.PORT) < 1 ||
      Number(process.env.PORT) > 65535)
  )
    throw new Error('PORT debe ser un entero entre 1 y 65535');
  if (!env.keycloak.baseUrl || !env.keycloak.realm || !env.keycloak.audience)
    throw new Error('Falta configuración de Keycloak');
  const url = new URL(env.keycloak.baseUrl);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('KEYCLOAK_BASE_URL inválida');
}
