// src/components/PanelResumenMetricas/PanelResumenMetricas.jsx
//
// Grilla de 4 MetricCard. Recibe `metricas` para poder reutilizarse tanto en
// ListaDetalle (Total/Pendientes/Completadas/Prioridad alta) como en Tareas
// (que puede mostrar otro combo, ej. Total/Pendientes/Hoy/Completadas).
import MetricCard from '../ui/MetricCard/MetricCard'
import styles from './PanelResumenMetricas.module.css'

export default function PanelResumenMetricas({ metricas }) {
  return (
    <section className={styles.grid}>
      {metricas.map((m) => (
        <MetricCard key={m.etiqueta} etiqueta={m.etiqueta} valor={m.valor} icon={m.icon} tone={m.tone} />
      ))}
    </section>
  )
}

// Helper para armar las métricas estándar de tareas a partir de un arreglo.
export function metricasEstandarDeTareas(tareas = []) {
  const total = tareas.length
  const completadas = tareas.filter((t) => t.completada).length
  const pendientes = total - completadas
  const prioridadAlta = tareas.filter((t) => t.prioridad === 'alta').length

  return [
    { etiqueta: 'Total', valor: total, icon: 'task', tone: 'primary' },
    { etiqueta: 'Pendientes', valor: pendientes, icon: 'schedule', tone: 'warning' },
    { etiqueta: 'Completadas', valor: completadas, icon: 'check_circle', tone: 'success' },
    { etiqueta: 'Prioridad alta', valor: prioridadAlta, icon: 'error_outline', tone: 'danger' },
  ]
}
