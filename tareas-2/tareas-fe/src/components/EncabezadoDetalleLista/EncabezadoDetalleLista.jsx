// src/components/EncabezadoDetalleLista/EncabezadoDetalleLista.jsx
//
// Link "< Volver", título de la lista y botón "+ Nueva tarea", tal como en
// el mockup de detalle_de_lista.
import { Link } from 'react-router-dom'
import Boton from '../ui/Boton/Boton'
import styles from './EncabezadoDetalleLista.module.css'

export default function EncabezadoDetalleLista({ nombreLista, listaId }) {
  return (
    <div className={styles.contenedor}>
      <Link to="/listas" className={styles.volver}>
        <span className="material-symbols-outlined">arrow_back</span>
        Volver a mis listas
      </Link>

      <div className={styles.fila}>
        <h1 className={styles.titulo}>{nombreLista}</h1>
        <Link to={`/listas/${listaId}/tareas/nueva`}>
          <Boton variant="primary" icon="add">Nueva tarea</Boton>
        </Link>
      </div>
    </div>
  )
}
