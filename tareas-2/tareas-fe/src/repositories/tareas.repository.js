// src/repositories/tareas.repository.js
import api from './axios.config'

// GET /api/tareas
const obtenerTareas = async () => {
  const res = await api.get('/tareas')
  return res.data.data
}

// GET /api/tareas/:id
const obtenerTareaPorId = async (id) => {
  const res = await api.get(`/tareas/${id}`)
  return res.data.data
}

// POST /api/tareas
const crearTarea = async (datos) => {
  const res = await api.post('/tareas', datos)
  return res.data.data
}

// PATCH /api/tareas/:id  (parcial: por ejemplo solo { prioridad: 'alta' })
const actualizarTarea = async (id, datos) => {
  const res = await api.patch(`/tareas/${id}`, datos)
  return res.data.data
}

// PATCH /api/tareas/:id/completar
const completarTarea = async (id) => {
  const res = await api.patch(`/tareas/${id}/completar`)
  return res.data.data
}

// DELETE /api/tareas/:id
const eliminarTarea = async (id) => {
  const res = await api.delete(`/tareas/${id}`)
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
