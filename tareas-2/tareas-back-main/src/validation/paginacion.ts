import { HttpError } from '../utils/HttpError.js';
export interface Paginacion {
  page: number;
  limit: number;
  offset: number;
}
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}
export function paginacion(query: Record<string, unknown> = {}): Paginacion {
  function entero(key: string, fallback: number, max: number) {
    const value = query[key];
    if (value === undefined) return fallback;
    if (
      typeof value !== 'string' ||
      !/^[1-9]\d*$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) > max
    )
      throw new HttpError(400, 'PAGINACION_INVALIDA', `${key} debe ser un entero entre 1 y ${max}`);
    return Number(value);
  }
  const page = entero('page', 1, 1000000);
  const limit = entero('limit', 50, 100);
  return { page, limit, offset: (page - 1) * limit };
}
export function pageMeta(total: number, p: Paginacion): PageMeta {
  return {
    page: p.page,
    limit: p.limit,
    total,
    totalPages: Math.ceil(total / p.limit),
    hasNextPage: p.offset + p.limit < total,
  };
}
