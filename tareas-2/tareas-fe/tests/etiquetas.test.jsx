import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TarjetaTarea from '../src/components/TarjetaTarea'
import EtiquetasInput from '../src/components/EtiquetasInput/EtiquetasInput'
import ErrorBoundary from '../src/components/ErrorBoundary'

describe('Regresión BE-02: datos históricos de etiquetas', () => {
  it.each(['texto', null, { nombre: 'objeto' }, [null, {}, 12]])(
    'una tarjeta con %j no rompe la vista',
    (etiquetas) => {
      render(
        <MemoryRouter>
          <TarjetaTarea
            tarea={{ id: 1, titulo: 'Tarea conservada', etiquetas }}
          />
        </MemoryRouter>,
      )
      expect(
        screen.getByRole('heading', { name: 'Tarea conservada' }),
      ).toBeTruthy()
      expect(screen.getByText('Pendiente')).toBeTruthy()
    },
  )

  it('conserva solo etiquetas textuales válidas y permite completar la tarea', () => {
    const onCompletar = vi.fn()
    const tarea = {
      id: 1,
      titulo: 'Tarea',
      etiquetas: [' api ', 'api', {}, 'backend'],
    }
    render(
      <MemoryRouter>
        <TarjetaTarea tarea={tarea} onCompletar={onCompletar} />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('#api')).toHaveLength(1)
    expect(screen.getByText('#backend')).toBeTruthy()
    fireEvent.click(screen.getByTitle('Marcar completada'))
    expect(onCompletar).toHaveBeenCalledWith(tarea)
  })

  it('permite editar etiquetas aunque el valor inicial incumpla el contrato', () => {
    const onChange = vi.fn()
    render(<EtiquetasInput valor="texto" onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Etiquetas' })
    fireEvent.change(input, { target: { value: ' nueva ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['nueva'])
  })

  it('no duplica etiquetas y permite quitar una con teclado', () => {
    const onChange = vi.fn()
    render(<EtiquetasInput valor={['api']} onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Etiquetas' })
    fireEvent.change(input, { target: { value: 'api' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('no admite más etiquetas que el contrato del backend', () => {
    render(
      <EtiquetasInput
        valor={Array.from({ length: 20 }, (_, i) => `tag${i}`)}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('textbox', { name: 'Etiquetas' }).disabled).toBe(
      true,
    )
  })
})

it('contiene una excepción de render y ofrece recuperación visible', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  function Roto() {
    throw new Error('error de render de prueba')
  }
  render(
    <ErrorBoundary>
      <Roto />
    </ErrorBoundary>,
  )
  expect(screen.getByRole('alert').textContent).toContain(
    'No se pudo mostrar esta pantalla',
  )
  expect(screen.getByRole('button', { name: 'Recargar' })).toBeTruthy()
})
