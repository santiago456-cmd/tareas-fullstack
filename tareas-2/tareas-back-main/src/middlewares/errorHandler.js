import { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } from 'sequelize';
import { HttpError } from '../utils/HttpError.js';
import { errorResponse } from '../utils/apiResponse.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let publicError = error instanceof HttpError ? error : null;
  if (!publicError && error instanceof UniqueConstraintError) {
    publicError = new HttpError(409, 'RECURSO_DUPLICADO', 'Ya existe un recurso con esos datos');
  } else if (!publicError && error instanceof ForeignKeyConstraintError) {
    publicError = new HttpError(
      409,
      'CONFLICTO_REFERENCIA',
      'El recurso cambió o tiene datos asociados; actualice la vista'
    );
  } else if (!publicError && error instanceof ValidationError) {
    publicError = new HttpError(
      400,
      'DATOS_INVALIDOS',
      'Los datos no cumplen las restricciones del recurso'
    );
  } else if (!publicError && error.type === 'entity.parse.failed') {
    publicError = new HttpError(400, 'JSON_INVALIDO', 'El cuerpo no contiene JSON válido');
  } else if (!publicError && error.type === 'entity.too.large') {
    publicError = new HttpError(
      413,
      'CUERPO_DEMASIADO_GRANDE',
      'El cuerpo supera el límite de 100 KB'
    );
  } else if (!publicError && ['encoding.unsupported', 'charset.unsupported'].includes(error.type)) {
    publicError = new HttpError(
      415,
      'CODIFICACION_NO_SOPORTADA',
      'La codificación del cuerpo no está soportada'
    );
  } else if (!publicError && ['request.aborted', 'request.size.invalid'].includes(error.type)) {
    publicError = new HttpError(
      400,
      'CUERPO_INVALIDO',
      'No se pudo leer el cuerpo de la solicitud'
    );
  } else if (!publicError && error.original?.code === 'SQLITE_BUSY') {
    publicError = new HttpError(
      503,
      'BASE_OCUPADA',
      'El servicio está ocupado; intente nuevamente'
    );
    res.set('Retry-After', '1');
  }
  publicError ??= new HttpError(500, 'ERROR_INTERNO', 'Ocurrió un error interno del servidor');
  if (publicError.status >= 500) {
    // No registrar cuerpo, query, tokens, SQL ni mensajes sin redactar del proveedor.
    console.error(
      JSON.stringify({
        event: 'request_error',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: publicError.status,
        errorType: error.name,
      })
    );
  }
  return res.status(publicError.status).json(
    errorResponse({
      message: publicError.message,
      code: publicError.code,
      details: publicError.details,
    })
  );
}
