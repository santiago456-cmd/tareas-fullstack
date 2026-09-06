// src/components/ListaCard/ListaCard.jsx
//
// Tarjeta de una lista dentro de la grilla de "Mis listas": borde de color a
// la izquierda, nombre, badge con cantidad de tareas, e íconos de editar /
// eliminar que aparecen al hacer hover (ver .acciones en el CSS module).
import { Link } from 'react-router-dom'
import styles from './ListaCard.module.css'

export default function ListaCard({ lista, onEditar, onEliminar }) {
  const color = lista.color || 'var(--color-primary)'

  return (
    <div className={styles.card} style={{ borderLeftColor: color }}>
      <div className={styles.encabezado}>
        <Link to={`/listas/${lista.id}`} className={styles.nombre}>
          {lista.nombre}
        </Link>

        <div className={styles.acciones}>
          <button
            className={styles.accionBoton}
            title="Editar"
            onClick={(e) => {
              e.preventDefault()
              onEditar(lista.id)
            }}
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button
            className={`${styles.accionBoton} ${styles.accionEliminar}`}
            title="Eliminar"
            onClick={(e) => {
              e.preventDefault()
              onEliminar(lista.id)
            }}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>

      <div className={styles.pie}>
        <span className={styles.contador}>{lista.cantidadTareas ?? 0} tareas</span>
      </div>
    </div>
  )
}
