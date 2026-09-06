import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { errorResponse } from '../utils/apiResponse.js';

export function validateIdParam(paramName = 'id'): RequestHandler {
  return function validateIdParamMiddleware(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params[paramName]);
    if (
      typeof req.params[paramName] !== 'string' ||
      !/^[1-9]\d*$/.test(req.params[paramName]) ||
      !Number.isSafeInteger(id)
    ) {
      return res.status(400).json(
        errorResponse({
          message: `El parametro ${paramName} debe ser un entero positivo`,
          code: 'ID_PARAM_INVALIDO',
          details: {
            paramName,
            value: req.params[paramName],
          },
        })
      );
    }
    req.validatedParams = {
      ...req.validatedParams,
      [paramName]: id,
    };
    next();
  };
}
