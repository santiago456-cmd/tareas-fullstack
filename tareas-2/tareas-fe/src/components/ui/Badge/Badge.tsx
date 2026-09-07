import type { Tone } from '../../../types'
import type { ReactNode } from 'react'
// src/components/ui/Badge/Badge.tsx
//
// Pill de estado/prioridad/metadata. tone controla el color semántico según
// DESIGN.md ("Badges & Chips": fondo al 10% de opacidad + texto del mismo tono).
import styles from './Badge.module.css'

const TONOS_VALIDOS = ['neutral', 'primary', 'success', 'warning', 'danger']

export default function Badge({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: Tone
  icon?: string
  children?: ReactNode
}) {
  const tono = TONOS_VALIDOS.includes(tone) ? tone : 'neutral'

  return (
    <span className={`${styles.badge} ${styles[tono]}`}>
      {icon && (
        <span aria-hidden="true" className="material-symbols-outlined">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
