// src/pages/Tareas.tsx
import { useCallback } from 'react'
import { useCarga } from '../hooks/useCarga'
import EstadoCarga from '../components/EstadoCarga'
import type { Tarea } from '../types'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import tareasRepository from '../repositories/tareas.repository'
import listasRepository from '../repositories/listas.repository'
import { mensajeDeError } from '../repositories/errores'
import BarraFiltros from '../components/BarraFiltros/BarraFiltros'
import PanelResumenMetricas, {
  metricasEstandarDeTareas,
} from '../components/PanelResumenMetricas/PanelResumenMetricas'
import ListaTareas from '../components/ListaTareas'
import styles from './Tareas.module.css'

export default function Tareas() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filtroLista = searchParams.get('lista') ?? ''
  const filtroPrioridad = searchParams.get('prioridad') ?? ''
  const filtroEstado = searchParams.get('estado') ?? ''

  const loader = useCallback(async () => {
    const [tareas, listas] = await Promise.all([
      tareasRepository.obtenerTareas(),
      listasRepository.obtenerListas(),
    ])
    return { tareas, listas }
  }, [])
  const { data, cargando, error, cargar } = useCarga(loader)
  const tareas = data?.tareas ?? []
  const listas = data?.listas ?? []

  const actualizarFiltro = (clave: string, valor: string) => {
    const nuevos = new URLSearchParams(searchParams)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    setSearchParams(nuevos)
  }

  const nombreDeLista = (listaId?: number) =>
    listas.find((l) => l.id === listaId)?.nombre || ''

  const completar = async (tarea: Tarea) => {
    if (tarea.completada) return
    try {
      await tareasRepository.completarTarea(tarea.id)
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err))
    }
  }

  const eliminarTarea = async (id: number) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return
    try {
      await tareasRepository.eliminarTarea(id)
      toast.success('Tarea eliminada')
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err))
    }
  }

  const tareasFiltradas = tareas
    .filter((t) => (filtroLista ? String(t.listaId) === filtroLista : true))
    .filter((t) => (filtroPrioridad ? t.prioridad === filtroPrioridad : true))
    .filter((t) => {
      if (filtroEstado === 'completadas') return t.completada
      if (filtroEstado === 'pendientes') return !t.completada
      return true
    })

  if (cargando || error)
    return <EstadoCarga error={error} reintentar={cargar} />

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Todas las tareas</h1>
        <p className={styles.subtitulo}>
          Gestioná tu flujo de trabajo global desde un solo lugar.
        </p>
      </header>

      <BarraFiltros
        listas={listas}
        filtroLista={filtroLista}
        filtroPrioridad={filtroPrioridad}
        filtroEstado={filtroEstado}
        onCambiarFiltro={actualizarFiltro}
        onLimpiar={() => setSearchParams({})}
      />

      <PanelResumenMetricas
        metricas={metricasEstandarDeTareas(tareasFiltradas)}
      />

      <ListaTareas
        tareas={tareasFiltradas}
        onCompletar={completar}
        onEliminar={eliminarTarea}
        nombreDeLista={nombreDeLista}
      />
    </div>
  )
}
