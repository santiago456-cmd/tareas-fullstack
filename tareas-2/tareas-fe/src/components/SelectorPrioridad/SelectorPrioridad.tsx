import { useId } from 'react'
import type { Prioridad } from '../../types'
import styles from './SelectorPrioridad.module.css'
const opciones = [
  { valor: 'baja', texto: 'Baja', tone: 'success' },
  { valor: 'media', texto: 'Media', tone: 'warning' },
  { valor: 'alta', texto: 'Alta', tone: 'danger' },
] as const
export default function SelectorPrioridad({
  valor,
  onChange,
}: {
  valor: Prioridad
  onChange: (v: Prioridad) => void
}) {
  const name = useId()
  return (
    <fieldset className={styles.grupo}>
      <legend>Prioridad</legend>
      {opciones.map((op) => (
        <label
          key={op.valor}
          className={`${styles.chip} ${styles[op.tone]} ${valor === op.valor ? styles.activo : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={op.valor}
            checked={valor === op.valor}
            onChange={() => onChange(op.valor)}
          />
          {op.texto}
        </label>
      ))}
    </fieldset>
  )
}
