// src/repositories/listas.repository.js
import api from './axios.config'
import { obtenerColeccion } from './paginacion'

const RECURSO = '/listas'

// GET /api/listas?incluirVacias=...
const obtenerListas = async ({ incluirVacias = true } = {}) => {
  const { items } = await obtenerColeccion(async page => (await api.get(RECURSO, { params: { incluirVacias, page, limit: 100 } })).data)
  return items
}

// GET /api/listas/:id
const obtenerListaPorId = async (id) => {
  const res = await api.get(`${RECURSO}/${id}`)
  return res.data.data
}

// GET /api/listas/:id/tareas  → la lista con su arreglo `tareas`
const obtenerListaConTareas = async (id) => {
  const { first, items } = await obtenerColeccion(async page => (await api.get(`${RECURSO}/${id}/tareas`, { params: { page, limit: 100 } })).data, body => body.data.tareas)
  return { ...first.data, tareas: items }
}

// POST /api/listas
const crearLista = async (datos) => {
  const res = await api.post(RECURSO, datos)
  return res.data.data
}

// PATCH /api/listas/:id  (parcial; ojo: PATCH, no PUT)
const actualizarLista = async (id, datos) => {
  const res = await api.patch(`${RECURSO}/${id}`, datos)
  return res.data.data
}

// DELETE /api/listas/:id
const eliminarLista = async (id) => {
  const res = await api.delete(`${RECURSO}/${id}`)
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
