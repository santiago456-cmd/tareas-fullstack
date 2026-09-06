// src/components/Encabezado.jsx
//
// TopNavBar: logo, pills de navegación (Listas/Tareas) con estado activo,
// y el estado de sesión (TokenBar) a la derecha.
import { NavLink } from 'react-router-dom'
import TokenBar from './TokenBar'
import styles from './Encabezado.module.css'

export default function Encabezado() {
  const clasePill = ({ isActive }) => (isActive ? `${styles.link} ${styles.linkActivo}` : styles.link)

  return (
    <header className={styles.nav}>
      <div className={styles.contenido}>
        <div className={styles.izquierda}>
          <NavLink to="/listas" className={styles.marca}>
            Gestor de Tareas
          </NavLink>
          <nav className={styles.links}>
            <NavLink to="/listas" className={clasePill}>Listas</NavLink>
            <NavLink to="/tareas" className={clasePill}>Tareas</NavLink>
          </nav>
        </div>

        <TokenBar />
      </div>
    </header>
  )
}
