import type { NextFunction, Request, Response } from 'express';
import { CuentasService } from '../services/CuentasService.js';
import { HttpError } from '../utils/HttpError.js';
const cuentasService = new CuentasService();
export default async function resolverCuenta(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new HttpError(401, 'NO_AUTENTICADO', 'Debe iniciar sesión para acceder'));
    }
    req.cuenta = await cuentasService.resolverDesdeUsuario(req.user);
    return next();
  } catch (error) {
    return next(error);
  }
}
