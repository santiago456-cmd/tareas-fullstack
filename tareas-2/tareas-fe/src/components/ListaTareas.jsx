// src/components/ListaTareas.jsx
import TarjetaTarea from './TarjetaTarea'
import styles from './ListaTareas.module.css'

export default function ListaTareas({ tareas = [], onCompletar, onEliminar, nombreDeLista }) {
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
