import { errorResponse } from '../utils/apiResponse.js';

export function validateIdParam(paramName = 'id') {
  return function validateIdParamMiddleware(req, res, next) {
    const id = Number(req.params[paramName]);
    if (!/^[1-9]\d*$/.test(req.params[paramName]) || !Number.isSafeInteger(id)) {
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
