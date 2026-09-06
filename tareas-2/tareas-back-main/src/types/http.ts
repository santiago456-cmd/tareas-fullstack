import type { Request, Response } from 'express';
import type { Cuenta } from '../models/Cuenta.js';
import { HttpError } from '../utils/HttpError.js';
import type { ApiResponse, UsuarioAutenticado } from './contracts.js';
declare global {
  namespace Express {
    interface Request {
      user?: UsuarioAutenticado;
      cuenta?: Cuenta;
      validatedParams?: Record<string, number>;
      requestId?: string;
    }
  }
}
export type ApiRequest = Request<Record<string, string>, ApiResponse, unknown>;
export type ApiRes = Response<ApiResponse>;
export function cuentaId(req: ApiRequest): number {
  if (!req.cuenta) throw new HttpError(401, 'NO_AUTENTICADO', 'Debe iniciar sesión para acceder');
  return req.cuenta.id;
}
export function parametroId(req: ApiRequest, name = 'id'): number {
  const value = req.validatedParams?.[name];
  if (value === undefined)
    throw new HttpError(400, 'ID_PARAM_INVALIDO', 'Falta un identificador válido');
  return value;
}
