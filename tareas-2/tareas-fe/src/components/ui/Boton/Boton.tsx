import type { ButtonHTMLAttributes } from 'react'
// src/components/ui/Boton/Boton.tsx
//
// Botón compartido con las 3 variantes documentadas en DESIGN.md:
// primary (sólido indigo), secondary (outline gris), ghost (solo texto).
import styles from './Boton.module.css'

export default function Boton({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: string
}) {
  const clases = [styles.boton, styles[variant], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={clases} {...props}>
      {icon && (
        <span aria-hidden="true" className="material-symbols-outlined">
          {icon}
        </span>
      )}
      {children && <span>{children}</span>}
    </button>
  )
}
