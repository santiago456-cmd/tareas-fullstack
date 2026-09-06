// src/components/ui/Modal/Modal.jsx
//
// Overlay + card centrada (Surface 2 en DESIGN.md: blur de fondo + sombra alta).
// onClose se dispara al clickear el backdrop.
import styles from './Modal.module.css'

export default function Modal({ titulo, onClose, children, footer }) {
  const detenerPropagacion = (e) => e.stopPropagation()

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={detenerPropagacion}>
        {titulo && (
          <div className={styles.header}>
            <h1 className={styles.titulo}>{titulo}</h1>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
