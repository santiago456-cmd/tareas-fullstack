import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TareaForm from '../src/pages/TareaForm'
import repository from '../src/repositories/tareas.repository'

vi.mock('../src/repositories/tareas.repository', () => ({
  default: {
    obtenerTareaPorId: vi.fn(),
    actualizarTarea: vi.fn(),
    crearTarea: vi.fn(),
  },
}))
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

it('carga un registro histórico, guarda etiquetas válidas y vuelve al listado', async () => {
  repository.obtenerTareaPorId.mockResolvedValue({
    id: 1,
    titulo: 'Tarea histórica',
    etiquetas: 'texto corrupto',
  })
  repository.actualizarTarea.mockResolvedValue({ id: 1 })
  render(
    <MemoryRouter initialEntries={['/tareas', '/tareas/1/editar']}>
      <Routes>
        <Route path="/tareas" element={<h1>Listado de regreso</h1>} />
        <Route path="/tareas/:id/editar" element={<TareaForm />} />
      </Routes>
    </MemoryRouter>,
  )
  expect(await screen.findByDisplayValue('Tarea histórica')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() =>
    expect(repository.actualizarTarea).toHaveBeenCalledWith('1', {
      titulo: 'Tarea histórica',
      descripcion: null,
      prioridad: 'media',
      fechaVencimiento: null,
      etiquetas: [],
    }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Listado de regreso' }),
  ).toBeTruthy()
})

it('un título demasiado corto no dispara la creación', async () => {
  repository.crearTarea.mockClear()
  render(
    <MemoryRouter initialEntries={['/listas/7/tareas/nueva']}>
      <Routes>
        <Route path="/listas/:listaId/tareas/nueva" element={<TareaForm />} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.change(await screen.findByLabelText('Título'), {
    target: { value: 'ab' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByText('Mínimo 3 caracteres')).toBeTruthy()
  expect(repository.crearTarea).not.toHaveBeenCalled()
})
