import { errorResponse } from '../utils/apiResponse.js';

export function notFoundMiddleware(req, res) {
  return res.status(404).json(
    errorResponse({
      message: 'El recurso solicitado no existe',
      code: 'ROUTE_NOT_FOUND',
      details: {
        method: req.method,
        path: req.originalUrl.split('?')[0],
      },
    })
  );
}
