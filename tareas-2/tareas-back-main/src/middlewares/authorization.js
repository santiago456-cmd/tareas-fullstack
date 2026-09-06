export function requiereUsuario(req, res, next) {
  if (!req.user) {
    return next(new HttpError(401, 'NO_AUTENTICADO', 'Debe iniciar sesión para acceder'));
  }
  return next();
}

export function requiereRol(rol) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    if (!roles.includes(rol)) {
      return next(new HttpError(403, 'NO_AUTORIZADO', 'No tiene permisos para esta operación'));
    }
    return next();
  };
}
import { HttpError } from '../utils/HttpError.js';
