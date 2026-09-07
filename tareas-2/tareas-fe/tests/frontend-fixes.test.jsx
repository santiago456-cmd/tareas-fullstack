import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import NuevaListaForm from '../src/components/NuevaListaForm/NuevaListaForm'
import TareaForm from '../src/pages/TareaForm'
import ListaDetalle from '../src/pages/ListaDetalle'
import repository from '../src/repositories/tareas.repository'
import listas from '../src/repositories/listas.repository'
import { toast } from 'react-toastify'
vi.mock('../src/repositories/tareas.repository', () => ({
  default: {
    obtenerTareaPorId: vi.fn(),
    actualizarTarea: vi.fn(),
    crearTarea: vi.fn(),
  },
}))
vi.mock('../src/repositories/listas.repository', () => ({
  default: { obtenerListaConTareas: vi.fn() },
}))
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
const deferred = () => {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}
const tarea = (titulo, listaId = 7) => ({
  id: 1,
  listaId,
  titulo,
  prioridad: 'media',
  etiquetas: [],
  descripcion: '',
  fechaVencimiento: null,
})
it('crear lista conserva el texto ante error y bloquea doble envío mientras espera', async () => {
  const d = deferred(),
    create = vi.fn(() => d.promise)
  render(<NuevaListaForm onCrear={create} />)
  const input = screen.getByLabelText('Nombre de la nueva lista')
  fireEvent.change(input, { target: { value: 'Conservar' } })
  fireEvent.submit(input.closest('form'))
  fireEvent.submit(input.closest('form'))
  expect(create).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Creando...' }).disabled).toBe(true)
  await act(async () => d.resolve(false))
  expect(input.value).toBe('Conservar')
  expect(screen.getByRole('alert')).toBeTruthy()
  create.mockResolvedValue(true)
  fireEvent.submit(input.closest('form'))
  await waitFor(() => expect(input.value).toBe(''))
})
function Jump() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/tareas/2/editar')}>Ir a B</button>
}
it('una respuesta de A tardía no reemplaza el formulario de B', async () => {
  const a = deferred()
  repository.obtenerTareaPorId.mockImplementation((id) =>
    id === '1' ? a.promise : Promise.resolve(tarea('Recurso B', 9)),
  )
  render(
    <MemoryRouter initialEntries={['/tareas/1/editar']}>
      <Jump />
      <Routes>
        <Route path="/tareas/:id/editar" element={<TareaForm />} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByText('Ir a B'))
  expect(await screen.findByDisplayValue('Recurso B')).toBeTruthy()
  await act(async () => a.resolve(tarea('Recurso A')))
  expect(screen.queryByDisplayValue('Recurso A')).toBeNull()
  expect(screen.getByLabelText('Título').value).toBe('Recurso B')
})
it('guardar bloquea envíos duplicados y una apertura directa vuelve a la lista', async () => {
  const d = deferred()
  repository.obtenerTareaPorId.mockResolvedValue(tarea('Guardar una vez'))
  repository.actualizarTarea.mockClear().mockReturnValue(d.promise)
  render(
    <MemoryRouter initialEntries={['/tareas/1/editar']}>
      <Routes>
        <Route path="/tareas/:id/editar" element={<TareaForm />} />
        <Route path="/listas/7" element={<h1>Lista destino</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  const input = await screen.findByLabelText('Título')
  fireEvent.submit(input.closest('form'))
  fireEvent.submit(input.closest('form'))
  await waitFor(() =>
    expect(repository.actualizarTarea).toHaveBeenCalledTimes(1),
  )
  expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(true)
  await act(async () => d.resolve({}))
  expect(await screen.findByText('Lista destino')).toBeTruthy()
})
it('un error de carga se distingue del vacío y permite reintentar', async () => {
  listas.obtenerListaConTareas
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({
      id: 3,
      nombre: 'Recuperada',
      tareas: [],
      descripcion: null,
      color: null,
    })
  render(
    <MemoryRouter initialEntries={['/listas/3']}>
      <Routes>
        <Route path="/listas/:id" element={<ListaDetalle />} />
      </Routes>
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByText('No hay tareas para mostrar.')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(
    await screen.findByRole('heading', { name: 'Recuperada' }),
  ).toBeTruthy()
})
it('una mutación que finaliza después de desmontar no emite éxito tardío', async () => {
  const d = deferred()
  repository.obtenerTareaPorId.mockResolvedValue(tarea('Tarea pendiente'))
  repository.actualizarTarea.mockClear().mockReturnValue(d.promise)
  toast.success.mockClear()
  const view = render(
    <MemoryRouter initialEntries={['/tareas/1/editar']}>
      <Routes>
        <Route path="/tareas/:id/editar" element={<TareaForm />} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.submit((await screen.findByLabelText('Título')).closest('form'))
  await waitFor(() =>
    expect(repository.actualizarTarea).toHaveBeenCalledTimes(1),
  )
  view.unmount()
  await act(async () => d.resolve({}))
  expect(toast.success).not.toHaveBeenCalled()
})
