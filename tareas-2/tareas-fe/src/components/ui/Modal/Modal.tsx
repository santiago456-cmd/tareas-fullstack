import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Modal.module.css'
export default function Modal({
  titulo,
  onClose,
  children,
  footer,
  ocupado = false,
}: {
  titulo: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  ocupado?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    if (!dialog) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={styles.card}
      aria-labelledby={titleId}
      aria-busy={ocupado}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return
        const controls = [
          ...e.currentTarget.querySelectorAll<HTMLElement>(
            'button, input, select, textarea, a[href], [tabindex]',
          ),
        ].filter(
          (element) =>
            !element.matches(':disabled') &&
            element.tabIndex >= 0 &&
            element.getClientRects().length > 0,
        )
        const first = controls[0],
          last = controls.at(-1)
        if (!first || !last) {
          e.preventDefault()
          e.currentTarget.focus()
          return
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === e.currentTarget)
        ) {
          e.preventDefault()
          last.focus()
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === e.currentTarget)
        ) {
          e.preventDefault()
          first.focus()
        }
      }}
      onCancel={(e) => {
        e.preventDefault()
        if (!ocupado) onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !ocupado) {
          const box = e.currentTarget.getBoundingClientRect()
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            onClose()
        }
      }}
    >
      <header className={styles.header}>
        <h1 id={titleId} className={styles.titulo}>
          {titulo}
        </h1>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </dialog>
  )
}
