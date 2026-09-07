import type { ApiResponse, Tarea, TareaInput, TareaPatch, Id } from '../types'
// src/repositories/tareas.repository.js
import api from './axios.config'
import { obtenerColeccion } from './paginacion'

// GET /api/tareas
const obtenerTareas = async () => {
  const { items } = await obtenerColeccion(
    async (page) =>
      (
        await api.get<ApiResponse<Tarea[]>>('/tareas', {
          params: { page, limit: 100 },
        })
      ).data,
    (body) => body.data,
  )
  return items
}

// GET /api/tareas/:id
const obtenerTareaPorId = async (id: Id) => {
  const res = await api.get<ApiResponse<Tarea>>(`/tareas/${id}`)
  return res.data.data
}

// POST /api/tareas
const crearTarea = async (datos: TareaInput) => {
  const res = await api.post<ApiResponse<Tarea>>('/tareas', datos)
  return res.data.data
}

// PATCH /api/tareas/:id  (parcial: por ejemplo solo { prioridad: 'alta' })
const actualizarTarea = async (id: Id, datos: TareaPatch) => {
  const res = await api.patch<ApiResponse<Tarea>>(`/tareas/${id}`, datos)
  return res.data.data
}

// PATCH /api/tareas/:id/completar
const completarTarea = async (id: Id) => {
  const res = await api.patch<ApiResponse<Tarea>>(`/tareas/${id}/completar`)
  return res.data.data
}

// DELETE /api/tareas/:id
const eliminarTarea = async (id: Id) => {
  const res = await api.delete<ApiResponse<{ id: number; titulo: string }>>(
    `/tareas/${id}`,
  )
  return res.data.data
}

export default {
  obtenerTareas,
  obtenerTareaPorId,
  crearTarea,
  actualizarTarea,
  completarTarea,
  eliminarTarea,
}
