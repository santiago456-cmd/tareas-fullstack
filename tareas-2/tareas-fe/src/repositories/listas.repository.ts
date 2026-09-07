import type { ApiResponse, Lista, ListaDetalle, ListaInput, Id } from '../types'
// src/repositories/listas.repository.js
import api from './axios.config'
import { obtenerColeccion } from './paginacion'

const RECURSO = '/listas'

// GET /api/listas?incluirVacias=...
const obtenerListas = async ({ incluirVacias = true } = {}) => {
  const { items } = await obtenerColeccion(
    async (page) =>
      (
        await api.get<ApiResponse<Lista[]>>(RECURSO, {
          params: { incluirVacias, page, limit: 100 },
        })
      ).data,
    (body) => body.data,
  )
  return items
}

// GET /api/listas/:id
const obtenerListaPorId = async (id: Id) => {
  const res = await api.get<ApiResponse<Lista>>(`${RECURSO}/${id}`)
  return res.data.data
}

// GET /api/listas/:id/tareas  → la lista con su arreglo `tareas`
const obtenerListaConTareas = async (id: Id) => {
  const { first, items } = await obtenerColeccion(
    async (page) =>
      (
        await api.get<ApiResponse<ListaDetalle>>(`${RECURSO}/${id}/tareas`, {
          params: { page, limit: 100 },
        })
      ).data,
    (body) => body.data.tareas,
  )
  return { ...first.data, tareas: items }
}

// POST /api/listas
const crearLista = async (datos: ListaInput) => {
  const res = await api.post<ApiResponse<Lista>>(RECURSO, datos)
  return res.data.data
}

// PATCH /api/listas/:id  (parcial; ojo: PATCH, no PUT)
const actualizarLista = async (id: Id, datos: Partial<ListaInput>) => {
  const res = await api.patch<ApiResponse<Lista>>(`${RECURSO}/${id}`, datos)
  return res.data.data
}

// DELETE /api/listas/:id
const eliminarLista = async (id: Id) => {
  const res = await api.delete<ApiResponse<{ id: number; nombre: string }>>(
    `${RECURSO}/${id}`,
  )
  return res.data.data
}

export default {
  obtenerListas,
  obtenerListaPorId,
  obtenerListaConTareas,
  crearLista,
  actualizarLista,
  eliminarLista,
}
