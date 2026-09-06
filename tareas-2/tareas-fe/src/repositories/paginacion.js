// Adaptador para las vistas actuales, que filtran y calculan métricas en memoria.
// Cada petición queda limitada; los consumidores de páginas pueden usar meta directamente.
export async function obtenerColeccion(getPage, select = body => body.data) {
  const items = new Map()
  let first
  for (let page = 1; ; page++) {
    const body = await getPage(page)
    first ??= body
    for (const item of select(body)) items.set(item.id, item)
    if (!body.meta?.hasNextPage) return { first, items: [...items.values()] }
    if (body.meta.page !== page || page >= 1000000) throw new Error('Paginación inconsistente')
  }
}
