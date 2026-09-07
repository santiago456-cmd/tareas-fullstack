import type { KeyboardEvent } from 'react'
// src/components/EtiquetasInput/EtiquetasInput.tsx
//
// Input de chips para el campo `etiquetas` (array de strings) que soporta
// api-tareas. Escribir y presionar Enter o "," agrega una etiqueta; cada
// chip tiene una x para quitarla.
import { useState } from 'react'
import styles from './EtiquetasInput.module.css'
import {
  normalizarEtiquetas,
  MAX_ETIQUETAS,
  MAX_ETIQUETA,
} from '../../utils/etiquetas'

export default function EtiquetasInput({
  valor = [],
  onChange,
}: {
  valor?: string[]
  onChange: (v: string[]) => void
}) {
  const etiquetas = normalizarEtiquetas(valor)
  const [texto, setTexto] = useState('')

  const agregar = () => {
    const limpio = texto.trim().replace(/,$/, '')
    if (!limpio) return
    if (limpio.length > MAX_ETIQUETA || etiquetas.length >= MAX_ETIQUETAS)
      return
    if (!etiquetas.includes(limpio)) onChange([...etiquetas, limpio])
    setTexto('')
  }

  const quitar = (etiqueta: string) => {
    onChange(etiquetas.filter((e) => e !== etiqueta))
  }

  const manejarTeclado = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      agregar()
    } else if (e.key === 'Backspace' && !texto && etiquetas.length > 0) {
      const ultima = etiquetas.at(-1)
      if (ultima) quitar(ultima)
    }
  }

  return (
    <div className={styles.contenedor}>
      {etiquetas.map((etiqueta) => (
        <span key={etiqueta} className={styles.chip}>
          #{etiqueta}
          <button
            type="button"
            className={styles.quitar}
            onClick={() => quitar(etiqueta)}
            aria-label={`Quitar etiqueta ${etiqueta}`}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </span>
      ))}
      <input
        className={styles.input}
        aria-label="Etiquetas"
        maxLength={MAX_ETIQUETA}
        disabled={etiquetas.length >= MAX_ETIQUETAS}
        placeholder={
          etiquetas.length === 0
            ? 'Agregar etiqueta y presionar Enter...'
            : 'Agregar otra...'
        }
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={manejarTeclado}
        onBlur={agregar}
      />
    </div>
  )
}
