export function successResponse({ message = 'Operación exitosa', data = null, meta = null }) {
  return {
    success: true,
    message,
    data,
    meta,
    error: null,
  };
}

export function errorResponse({ message = 'Ocurrió un error', code = 'ERROR', details = null }) {
  return {
    success: false,
    message,
    data: null,
    meta: null,
    error: {
      code,
      details,
    },
  };
}
