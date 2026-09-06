// src/components/BarraFiltros/BarraFiltros.jsx
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
}) {
  return (
    <section className={styles.barra}>
      <label className={styles.filtro}>
        <span className="material-symbols-outlined">filter_list</span>
        <select
          value={filtroLista}
          onChange={(e) => onCambiarFiltro('lista', e.target.value)}
          className={styles.select}
        >
          <option value="">Lista: Todas</option>
          {listas.map((l) => (
            <option key={l.id} value={l.id}>{l.nombre}</option>
          ))}
        </select>
      </label>

      <label className={styles.filtro}>
        <span className="material-symbols-outlined">priority_high</span>
        <select
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
        <span className="material-symbols-outlined">check_circle</span>
        <select
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
        <span className="material-symbols-outlined">close</span>
        Limpiar
      </button>
    </section>
  )
}
