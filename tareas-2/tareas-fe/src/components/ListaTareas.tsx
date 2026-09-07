import type { Tarea } from '../types'
// src/components/ListaTareas.tsx
import TarjetaTarea from './TarjetaTarea'
import styles from './ListaTareas.module.css'

export default function ListaTareas({
  tareas = [],
  onCompletar,
  onEliminar,
  nombreDeLista,
}: {
  tareas?: Tarea[]
  onCompletar: (t: Tarea) => Promise<void>
  onEliminar: (id: number) => Promise<void>
  nombreDeLista?: (id?: number) => string
}) {
  if (tareas.length === 0) {
    return <p className={styles.vacio}>No hay tareas para mostrar.</p>
  }

  return (
    <div className={styles.lista}>
      {tareas.map((tarea) => (
        <TarjetaTarea
          key={tarea.id}
          tarea={tarea}
          onCompletar={onCompletar}
          onEliminar={onEliminar}
          nombreLista={nombreDeLista ? nombreDeLista(tarea.listaId) : ''}
        />
      ))}
    </div>
  )
}
