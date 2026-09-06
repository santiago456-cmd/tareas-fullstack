// src/repositories/axios.config.js
import axios from 'axios'
import { obtenerToken, invalidarSesion } from '../auth/oauth'

// La URL base sale de .env (VITE_API_URL); si no está definida, usamos el
// valor por defecto del backend api-tareas.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// api-tareas protege /api/listas y /api/tareas con Bearer token.
api.interceptors.request.use(async (config) => {
  const token = await obtenerToken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const header = error.config?.headers?.Authorization
      if (header?.startsWith('Bearer ')) invalidarSesion(header.slice(7))
    }
    return Promise.reject(error)
  },
)

export default api
