import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

const issuer = `${env.keycloak.baseUrl}/realms/${env.keycloak.realm}`;
const jwksUri = `${issuer}/protocol/openid-connect/certs`;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

function normalizarRoles(payload) {
  const roles = payload?.realm_access?.roles;
  return Array.isArray(roles) ? roles : [];
}

export default async function tokenExtractor(req, res, next) {
  try {
    const authorization = req.get('authorization');
    if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
      return next(new HttpError(401, 'TOKEN_REQUERIDO', 'Debe iniciar sesión para acceder'));
    }

    const token = authorization.substring('bearer '.length).trim();

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: env.keycloak.audience,
    });

    if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('SUB_INVALIDO');

    req.user = {
      id: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      roles: normalizarRoles(payload),
    };

    return next();
  } catch {
    return next(
      new HttpError(401, 'TOKEN_INVALIDO', 'La sesión es inválida o venció; vuelva a ingresar')
    );
  }
}
