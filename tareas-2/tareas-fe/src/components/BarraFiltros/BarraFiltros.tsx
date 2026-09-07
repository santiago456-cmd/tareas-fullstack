import type { Lista } from '../../types'
// src/components/BarraFiltros/BarraFiltros.tsx
//
// Fila de filtros de la vista "Todas las tareas": selects nativos disfrazados
// de chips (mantiene accesibilidad de <select> real) + botón Limpiar.
import styles from './BarraFiltros.module.css'

export default function BarraFiltros({
  listas,
  filtroLista,
  filtroPrioridad,
  filtroEstado,
  onCambiarFiltro,
  onLimpiar,
}: {
  listas: Lista[]
  filtroLista: string
  filtroPrioridad: string
  filtroEstado: string
  onCambiarFiltro: (clave: string, valor: string) => void
  onLimpiar: () => void
}) {
  return (
    <section className={styles.barra}>
      <label className={styles.filtro}>
        <span aria-hidden="true" className="material-symbols-outlined">
          filter_list
        </span>
        <select
          aria-label="Filtrar por lista"
          value={filtroLista}
          onChange={(e) => onCambiarFiltro('lista', e.target.value)}
          className={styles.select}
        >
          <option value="">Lista: Todas</option>
          {listas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filtro}>
        <span aria-hidden="true" className="material-symbols-outlined">
          priority_high
        </span>
        <select
          aria-label="Filtrar por prioridad"
          value={filtroPrioridad}
          onChange={(e) => onCambiarFiltro('prioridad', e.target.value)}
          className={styles.select}
        >
          <option value="">Prioridad: Todas</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </label>

      <label className={styles.filtro}>
        <span aria-hidden="true" className="material-symbols-outlined">
          check_circle
        </span>
        <select
          aria-label="Filtrar por estado"
          value={filtroEstado}
          onChange={(e) => onCambiarFiltro('estado', e.target.value)}
          className={styles.select}
        >
          <option value="">Estado: Todos</option>
          <option value="pendientes">Pendientes</option>
          <option value="completadas">Completadas</option>
        </select>
      </label>

      <div className={styles.separador} />

      <button className={styles.limpiar} onClick={onLimpiar}>
        <span aria-hidden="true" className="material-symbols-outlined">
          close
        </span>
        Limpiar
      </button>
    </section>
  )
}
