import { AxiosError } from 'axios'
import { beforeEach, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
let kc
beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  kc = {
    authenticated: false,
    init: vi.fn(async () => false),
    updateToken: vi.fn(async () => false),
    clearToken: vi.fn(() => {
      kc.authenticated = false
      kc.token = undefined
    }),
    login: vi.fn(),
  }
  vi.doMock('keycloak-js', () => ({
    default: class {
      constructor() {
        return kc
      }
    },
  }))
})
test('inicialización única y eliminación de tokens heredados', async () => {
  for (const key of ['access_token', 'refresh_token', 'id_token'])
    localStorage.setItem(key, 'legacy')
  const auth = await import('../src/auth/oauth')
  await Promise.all([auth.inicializarSesion(), auth.inicializarSesion()])
  expect(kc.init).toHaveBeenCalledTimes(1)
  expect(kc.init).toHaveBeenCalledWith(
    expect.objectContaining({ pkceMethod: 'S256', flow: 'standard' }),
  )
  expect(localStorage.length).toBe(0)
})
test('barra y rutas reaccionan al ingreso y vencimiento sin remontar en StrictMode', async () => {
  const auth = await import('../src/auth/oauth')
  const { default: Bar } = await import('../src/components/TokenBar')
  const { default: Guard } = await import('../src/components/RequiereAuth')
  await auth.inicializarSesion()
  render(
    <StrictMode>
      <Bar />
      <Guard>
        <p>Privado</p>
      </Guard>
    </StrictMode>,
  )
  expect(screen.queryByText('Privado')).toBeNull()
  act(() => {
    kc.authenticated = true
    kc.token = 'a'
    kc.idTokenParsed = { name: 'Ana' }
    kc.onAuthSuccess()
  })
  expect(screen.getByTitle('Ana')).toBeTruthy()
  expect(screen.getByText('Privado')).toBeTruthy()
  kc.updateToken.mockRejectedValueOnce(new Error('expired'))
  await act(async () => {
    await expect(auth.obtenerToken()).rejects.toThrow('venció')
  })
  expect(screen.queryByText('Privado')).toBeNull()
  expect(screen.queryByText('Salir')).toBeNull()
  expect(localStorage.length).toBe(0)
})
test('renovación concurrente única y 401 antiguo no borra sesión nueva', async () => {
  const auth = await import('../src/auth/oauth')
  await auth.inicializarSesion()
  kc.authenticated = true
  kc.updateToken.mockImplementation(async () => {
    kc.token = 'new'
    return true
  })
  expect(await Promise.all([auth.obtenerToken(), auth.obtenerToken()])).toEqual(
    ['new', 'new'],
  )
  expect(kc.updateToken).toHaveBeenCalledTimes(1)
  auth.invalidarSesion('old')
  expect(kc.authenticated).toBe(true)
  auth.invalidarSesion('new')
  expect(kc.authenticated).toBe(false)
})
test('renovación en vuelo no restaura sesión cerrada', async () => {
  const auth = await import('../src/auth/oauth')
  await auth.inicializarSesion()
  kc.authenticated = true
  let finish
  kc.updateToken.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = auth.obtenerToken()
  await Promise.resolve()
  auth.invalidarSesion()
  kc.authenticated = true
  kc.token = 'late'
  finish(true)
  await expect(pending).rejects.toThrow()
  expect(kc.authenticated).toBe(false)
})
test('error de inicialización no deja sesión ni repite canje', async () => {
  kc.init.mockRejectedValue(new Error('secret'))
  const auth = await import('../src/auth/oauth')
  expect(await auth.inicializarSesion()).toBe(false)
  expect(await auth.inicializarSesion()).toBe(false)
  expect(kc.init).toHaveBeenCalledTimes(1)
  await expect(auth.obtenerToken()).rejects.toThrow('Debe iniciar sesión')
})
test('Axios bloquea peticiones sin sesión y no reintenta POST con 401', async () => {
  const auth = await import('../src/auth/oauth')
  const { default: api } = await import('../src/repositories/axios.config')
  await auth.inicializarSesion()
  const adapter = vi.fn(async (config) => ({ status: 200, data: {}, config }))
  await expect(api.get('/listas', { adapter })).rejects.toThrow(
    'Debe iniciar sesión',
  )
  expect(adapter).not.toHaveBeenCalled()
  kc.authenticated = true
  kc.token = 'current'
  adapter.mockImplementation(async (config) => {
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
      status: 401,
      data: {},
      headers: {},
      config,
    })
  })
  await expect(api.post('/listas', {}, { adapter })).rejects.toBeTruthy()
  expect(adapter).toHaveBeenCalledTimes(1)
  expect(kc.authenticated).toBe(false)
})

test('check-sso sin sesión vuelve al ingreso normal, sin mostrar error de callback', async () => {
  const auth = await import('../src/auth/oauth')
  const { default: Callback } = await import('../src/pages/AuthCallback')
  const { MemoryRouter, Routes, Route } = await import('react-router-dom')
  await auth.inicializarSesion()
  render(
    <MemoryRouter initialEntries={['/auth/callback']}>
      <Routes>
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/listas" element={<p>Ingreso normal</p>} />
      </Routes>
    </MemoryRouter>,
  )
  expect(screen.getByText('Ingreso normal')).toBeTruthy()
  expect(screen.queryByText('No se pudo iniciar sesión')).toBeNull()
})
