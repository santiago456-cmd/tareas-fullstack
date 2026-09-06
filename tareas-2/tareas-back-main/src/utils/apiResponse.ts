import type { ApiFailure, ApiSuccess } from '../types/contracts.js';
export function successResponse<T = unknown>({
  message = 'Operación exitosa',
  data = null,
  meta = null,
}: {
  message?: string;
  data?: T | null;
  meta?: unknown;
}): ApiSuccess<T> {
  return { success: true, message, data, meta, error: null };
}
export function errorResponse({
  message = 'Ocurrió un error',
  code = 'ERROR',
  details = null,
}: {
  message?: string;
  code?: string;
  details?: unknown;
}): ApiFailure {
  return { success: false, message, data: null, meta: null, error: { code, details } };
}
