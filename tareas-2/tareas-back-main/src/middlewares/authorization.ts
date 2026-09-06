import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/HttpError.js';
export function requiereUsuario(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new HttpError(401, 'NO_AUTENTICADO', 'Debe iniciar sesión para acceder'));
  }
  return next();
}

export function requiereRol(rol: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.user?.roles ?? [];
    if (!roles.includes(rol)) {
      return next(new HttpError(403, 'NO_AUTORIZADO', 'No tiene permisos para esta operación'));
    }
    return next();
  };
}
