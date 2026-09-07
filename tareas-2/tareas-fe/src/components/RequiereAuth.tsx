import type { ReactNode } from 'react'
// src/components/RequiereAuth.tsx
//
// Estado "sin sesión" (pantalla acceso_requerido del diseño): ícono de
// candado, título, texto secundario y botón primario de ingreso.
import { iniciarLogin, useSesion } from '../auth/oauth'
import Boton from './ui/Boton/Boton'
import styles from './RequiereAuth.module.css'

export default function RequiereAuth({ children }: { children: ReactNode }) {
  const { autenticado, error } = useSesion()
  if (!autenticado) {
    return (
      <div className={styles.contenedor}>
        <div className={styles.iconoWrapper}>
          <span className={`material-symbols-outlined ${styles.icono}`}>
            lock
          </span>
        </div>

        <h1 className={styles.titulo}>Necesitás iniciar sesión</h1>
        <p className={styles.subtitulo}>
          {error ||
            'Para gestionar tus tareas y organizar tu día, autenticate en la plataforma.'}
        </p>

        <Boton
          variant="primary"
          icon="login"
          onClick={iniciarLogin}
          className={styles.boton}
        >
          Ingresar
        </Boton>
      </div>
    )
  }

  return children
}
