// src/components/TokenBar.tsx
//
// Estado de sesión en la esquina derecha del TopNavBar: botón "Ingresar" pill
// si no hay sesión, o iniciales + "Salir" si la hay.
import { iniciarLogin, cerrarSesion, useSesion } from '../auth/oauth'
import styles from './TokenBar.module.css'

function iniciales(nombre = '') {
  return (
    nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'U'
  )
}

export default function TokenBar() {
  const { autenticado, usuario } = useSesion()

  if (autenticado) {
    return (
      <div className={styles.contenedor}>
        <div className={styles.avatar} title={usuario?.nombre || 'Usuario'}>
          {iniciales(usuario?.nombre)}
        </div>
        <button className={styles.salir} onClick={cerrarSesion}>
          Salir
        </button>
      </div>
    )
  }

  return (
    <button className={styles.ingresar} onClick={iniciarLogin}>
      Ingresar
    </button>
  )
}
