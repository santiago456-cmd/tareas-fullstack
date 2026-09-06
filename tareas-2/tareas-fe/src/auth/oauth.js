import Keycloak from 'keycloak-js'
import { useSyncExternalStore } from 'react'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'proyecto-tareas',
  clientId:
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'proyecto-tareas-node-backend',
})
const listeners = new Set()
let snapshot = { listo: false, autenticado: false, usuario: null, error: null }
let initialization
let refreshing
let generation = 0
function publish(error = null) {
  const payload = keycloak.idTokenParsed
  snapshot = {
    listo: true,
    autenticado: Boolean(keycloak.authenticated),
    error,
    usuario: keycloak.authenticated
      ? {
          nombre: payload?.name || payload?.preferred_username || 'Usuario',
          email: payload?.email || null,
        }
      : null,
  }
  listeners.forEach((listener) => listener())
}
export function useSesion() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
  )
}
export function invalidarSesion(token) {
  if (token && token !== keycloak.token) return
  generation++
  keycloak.clearToken()
  publish('La sesión terminó. Volvé a ingresar.')
}
keycloak.onAuthSuccess = () => publish()
keycloak.onAuthRefreshSuccess = () => publish()
keycloak.onAuthLogout = () => {
  generation++
  publish()
}
keycloak.onAuthRefreshError = () => invalidarSesion()
keycloak.onTokenExpired = () => {
  obtenerToken().catch(() => {})
}

// Una única inicialización, antes del router: StrictMode no vuelve a canjear el código.
export function inicializarSesion() {
  if (!initialization) {
    for (const key of ['access_token', 'refresh_token', 'id_token'])
      localStorage.removeItem(key)
    for (const key of ['pkce_state', 'pkce_code_verifier'])
      sessionStorage.removeItem(key)
    initialization = keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        flow: 'standard',
        responseMode: 'query',
        redirectUri: `${window.location.origin}/auth/callback`,
        checkLoginIframe: false,
        messageReceiveTimeout: 10000,
      })
      .then(() => {
        publish()
        return snapshot.autenticado
      })
      .catch(() => {
        invalidarSesion()
        publish('No se pudo iniciar la sesión. Reintentá recargando la página.')
        return false
      })
  }
  return initialization
}
export async function obtenerToken() {
  await inicializarSesion()
  if (!keycloak.authenticated) throw new Error('Debe iniciar sesión')
  if (!refreshing) {
    const started = generation
    refreshing = keycloak
      .updateToken(30)
      .then(() => {
        if (started !== generation || !keycloak.authenticated) {
          keycloak.clearToken()
          throw new Error('Sesión finalizada')
        }
        return keycloak.token
      })
      .catch(() => {
        invalidarSesion()
        throw new Error('La sesión venció; volvé a ingresar')
      })
      .finally(() => {
        refreshing = undefined
      })
  }
  return refreshing
}
export async function iniciarLogin() {
  await inicializarSesion()
  try {
    await keycloak.login({
      redirectUri: `${window.location.origin}/auth/callback`,
    })
  } catch {
    publish('No se pudo abrir el ingreso. Reintentá recargando la página.')
  }
}
export async function cerrarSesion() {
  const logoutUrl = keycloak.createLogoutUrl({
    redirectUri: window.location.origin,
  })
  invalidarSesion()
  window.location.assign(logoutUrl)
}
