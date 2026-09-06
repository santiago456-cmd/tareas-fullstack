// src/components/SelectorPrioridad/SelectorPrioridad.jsx
//
// Chips seleccionables baja/media/alta para el formulario de tarea (en vez
// de un <select> simple), tal como en el mockup de "Nueva tarea".
import styles from './SelectorPrioridad.module.css'

const OPCIONES = [
  { valor: 'baja', texto: 'Baja', tone: 'success', icon: 'signal_cellular_alt_1_bar' },
  { valor: 'media', texto: 'Media', tone: 'warning', icon: 'signal_cellular_alt_2_bar' },
  { valor: 'alta', texto: 'Alta', tone: 'danger', icon: 'signal_cellular_alt' },
]

export default function SelectorPrioridad({ valor, onChange }) {
  return (
    <div className={styles.grupo} role="radiogroup" aria-label="Prioridad">
      {OPCIONES.map((op) => {
        const activo = valor === op.valor
        return (
          <button
            type="button"
            key={op.valor}
            role="radio"
            aria-checked={activo}
            className={`${styles.chip} ${styles[op.tone]} ${activo ? styles.activo : ''}`}
            onClick={() => onChange(op.valor)}
          >
            <span className="material-symbols-outlined">{op.icon}</span>
            {op.texto}
          </button>
        )
      })}
    </div>
  )
}
