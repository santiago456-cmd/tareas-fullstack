// src/components/TarjetaTarea.jsx
//
// Tarjeta canónica de tarea, usada tanto en ListaDetalle como en Tareas
// (vista global). Border-left indigo si está pendiente, verde si completada;
// título tachado + atenuado cuando está completada. Muestra fechaVencimiento
// y etiquetas, los dos campos adicionales que soporta api-tareas.
import { Link } from 'react-router-dom'
import Badge from './ui/Badge/Badge'
import styles from './TarjetaTarea.module.css'
import { normalizarEtiquetas } from '../utils/etiquetas'

const PRIORIDAD_INFO = {
  alta: { texto: 'Alta', tone: 'danger', icon: 'priority_high' },
  media: { texto: 'Media', tone: 'warning', icon: 'signal_cellular_alt' },
  baja: { texto: 'Baja', tone: 'success', icon: 'signal_cellular_alt_1_bar' },
}

function formatearFecha(iso) {
  if (!iso) return null
  const fecha = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function estaVencida(iso, completada) {
  if (!iso || completada) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return new Date(`${iso.slice(0, 10)}T00:00:00`) < hoy
}

export default function TarjetaTarea({
  tarea,
  onCompletar,
  onEliminar,
  nombreLista,
}) {
  const etiquetas = normalizarEtiquetas(tarea.etiquetas)
  const prioridad = PRIORIDAD_INFO[tarea.prioridad] || null
  const completada = Boolean(tarea.completada)
  const fecha = formatearFecha(tarea.fechaVencimiento)
  const vencida = estaVencida(tarea.fechaVencimiento, completada)

  const clases = [
    styles.card,
    completada ? styles.completada : styles.pendiente,
  ].join(' ')

  return (
    <div className={clases}>
      <div className={styles.contenido}>
        <h3
          className={`${styles.titulo} ${completada ? styles.tituloCompletado : ''}`}
        >
          {tarea.titulo}
        </h3>

        {tarea.descripcion && (
          <p
            className={`${styles.descripcion} ${completada ? styles.descripcionCompletada : ''}`}
          >
            {tarea.descripcion}
          </p>
        )}

        <div className={styles.badges}>
          {prioridad && (
            <Badge tone={prioridad.tone} icon={prioridad.icon}>
              {prioridad.texto}
            </Badge>
          )}

          <Badge
            tone={completada ? 'success' : 'primary'}
            icon={completada ? 'check' : undefined}
          >
            {completada ? 'Completada' : 'Pendiente'}
          </Badge>

          {nombreLista && <Badge tone="neutral">{nombreLista}</Badge>}

          {fecha && (
            <span
              className={`${styles.fecha} ${vencida ? styles.fechaVencida : ''}`}
            >
              <span className="material-symbols-outlined">
                {vencida ? 'event_busy' : 'calendar_today'}
              </span>
              {fecha}
            </span>
          )}
        </div>

        {etiquetas.length > 0 && (
          <div className={styles.etiquetas}>
            {etiquetas.map((etiqueta) => (
              <span key={etiqueta} className={styles.etiqueta}>
                #{etiqueta}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.acciones}>
        {!completada && (
          <button
            className={`${styles.accionBoton} ${styles.completar}`}
            title="Marcar completada"
            onClick={() => onCompletar(tarea)}
          >
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        )}

        <Link
          to={`/tareas/${tarea.id}/editar`}
          className={styles.accionBoton}
          title="Editar"
        >
          <span className="material-symbols-outlined">edit</span>
        </Link>

        <button
          className={`${styles.accionBoton} ${styles.eliminar}`}
          title="Eliminar"
          onClick={() => onEliminar(tarea.id)}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  )
}
