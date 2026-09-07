import { colorVisible } from '../../utils/colores'
import { useAccion } from '../../hooks/useAccion'
import type { Lista } from '../../types'
// src/components/ListaCard/ListaCard.tsx
//
// Tarjeta de una lista dentro de la grilla de "Mis listas": borde de color a
// la izquierda, nombre, badge con cantidad de tareas, e íconos de editar /
// eliminar que aparecen al hacer hover (ver .acciones en el CSS module).
import { Link } from 'react-router-dom'
import styles from './ListaCard.module.css'

export default function ListaCard({
  lista,
  onEditar,
  onEliminar,
}: {
  lista: Lista
  onEditar: (id: number) => void
  onEliminar: (id: number) => Promise<void>
}) {
  const { ocupado, ejecutar } = useAccion()
  const color = colorVisible(lista.color)

  return (
    <div className={styles.card} style={{ borderLeftColor: color }}>
      <div className={styles.encabezado}>
        <Link to={`/listas/${lista.id}`} className={styles.nombre}>
          {lista.nombre}
        </Link>

        <div className={styles.acciones}>
          <button
            disabled={ocupado}
            className={styles.accionBoton}
            title="Editar"
            aria-label="Editar"
            onClick={(e) => {
              e.preventDefault()
              onEditar(lista.id)
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              edit
            </span>
          </button>
          <button
            disabled={ocupado}
            className={`${styles.accionBoton} ${styles.accionEliminar}`}
            title="Eliminar"
            aria-label="Eliminar"
            onClick={(e) => {
              e.preventDefault()
              void ejecutar(() => onEliminar(lista.id))
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              delete
            </span>
          </button>
        </div>
      </div>

      {lista.descripcion && <p>{lista.descripcion}</p>}
      <div className={styles.pie}>
        <span className={styles.contador}>
          {lista.cantidadTareas ?? 0} tareas
        </span>
      </div>
    </div>
  )
}
