import type { ApiResponse } from '../types'
export async function obtenerColeccion<T extends { id: number }, D>(
  getPage: (page: number) => Promise<ApiResponse<D>>,
  select: (body: ApiResponse<D>) => T[],
): Promise<{ first: ApiResponse<D>; items: T[] }> {
  const items = new Map<number, T>()
  let first: ApiResponse<D> | undefined
  for (let page = 1; ; page++) {
    const body = await getPage(page)
    first ??= body
    for (const item of select(body)) items.set(item.id, item)
    if (!body.meta?.hasNextPage) return { first, items: [...items.values()] }
    if (body.meta.page !== page || page >= 1000000)
      throw new Error('Paginación inconsistente')
  }
}
