// src/repositories/errores.js
import axios from 'axios'

// api-tareas responde errores de negocio con la forma:
//   { success: false, message, data: null, meta: null, error: { code, details } }
// Los errores 401 del middleware pueden venir como { error: 'TOKEN_REQUERIDO' }.
export function mensajeDeError(
  error: unknown,
  porDefecto = 'Ocurrio un error inesperado',
) {
  if (axios.isAxiosError<{ message?: unknown; error?: unknown }>(error)) {
    // El backend respondió con un cuerpo de error de negocio.
    const mensajeBackend = error.response?.data?.message
    if (typeof mensajeBackend === 'string' && mensajeBackend)
      return mensajeBackend

    const codigoBackend = error.response?.data?.error
    if (typeof codigoBackend === 'string') return codigoBackend

    // Hubo pedido pero sin respuesta: problema de red o CORS.
    if (error.request && !error.response) {
      return 'No hubo respuesta del servidor (revisar que api-tareas esté corriendo).'
    }
  }
  return porDefecto
}
