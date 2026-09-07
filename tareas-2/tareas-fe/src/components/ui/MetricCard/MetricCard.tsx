import type { Tone } from '../../../types'
import type { ReactNode } from 'react'
// src/components/ui/MetricCard/MetricCard.tsx
//
// Una tarjeta de métrica individual (usada dentro de PanelResumenMetricas).
import styles from './MetricCard.module.css'

export default function MetricCard({
  etiqueta,
  valor,
  icon,
  tone = 'neutral',
}: {
  etiqueta: string
  valor: ReactNode
  icon?: string
  tone?: Tone
}) {
  return (
    <div className={styles.card}>
      <p className={styles.etiqueta}>{etiqueta}</p>
      <div className={styles.fila}>
        <span className={styles.valor}>{valor}</span>
        {icon && (
          <span
            className={`material-symbols-outlined ${styles.icono} ${styles[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  )
}
