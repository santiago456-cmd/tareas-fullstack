import type { NextFunction, Request, Response } from 'express';
import type { JWTPayload } from 'jose';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

const issuer = `${env.keycloak.baseUrl}/realms/${env.keycloak.realm}`;
const jwksUri = `${issuer}/protocol/openid-connect/certs`;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

function normalizarRoles(payload: JWTPayload) {
  const access = payload.realm_access;
  const roles =
    typeof access === 'object' && access !== null && 'roles' in access ? access.roles : [];
  return Array.isArray(roles)
    ? roles.filter((role): role is string => typeof role === 'string')
    : [];
}

export default async function tokenExtractor(req: Request, res: Response, next: NextFunction) {
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
      username:
        typeof payload.preferred_username === 'string' ? payload.preferred_username : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      roles: normalizarRoles(payload),
    };

    return next();
  } catch {
    return next(
      new HttpError(401, 'TOKEN_INVALIDO', 'La sesión es inválida o venció; vuelva a ingresar')
    );
  }
}
