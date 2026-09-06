import { describe, it, expect, vi } from 'vitest'
import { obtenerColeccion } from '../src/repositories/paginacion'

describe('colecciones paginadas', () => {
  it('conserva elementos posteriores a la primera página y evita duplicados', async () => {
    const get = vi.fn(async page => ({ data: [{ id: page }, { id: 3 }], meta: { page, hasNextPage: page < 2 } }))
    const { items } = await obtenerColeccion(get)
    expect(items.map(x => x.id)).toEqual([1, 3, 2])
    expect(get.mock.calls).toEqual([[1], [2]])
  })
  it('conserva el detalle de lista y acumula sus tareas', async () => {
    const { first, items } = await obtenerColeccion(async page => ({ data: { nombre: 'Lista', tareas: [{ id: page }] }, meta: { page, hasNextPage: page < 2 } }), body => body.data.tareas)
    expect(first.data.nombre).toBe('Lista')
    expect(items).toHaveLength(2)
  })
  it('no devuelve una colección incompleta si falla una página', async () => {
    await expect(obtenerColeccion(async page => {
      if (page === 2) throw new Error('sin conexión')
      return { data: [{ id: 1 }], meta: { page, hasNextPage: true } }
    })).rejects.toThrow('sin conexión')
  })
})
