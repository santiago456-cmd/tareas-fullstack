// src/pages/Tareas.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import tareasRepository from '../repositories/tareas.repository'
import listasRepository from '../repositories/listas.repository'
import { mensajeDeError } from '../repositories/errores'
import BarraFiltros from '../components/BarraFiltros/BarraFiltros'
import PanelResumenMetricas, { metricasEstandarDeTareas } from '../components/PanelResumenMetricas/PanelResumenMetricas'
import ListaTareas from '../components/ListaTareas'
import styles from './Tareas.module.css'

export default function Tareas() {
  const [tareas, setTareas] = useState([])
  const [listas, setListas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const filtroLista = searchParams.get('lista') ?? ''
  const filtroPrioridad = searchParams.get('prioridad') ?? ''
  const filtroEstado = searchParams.get('estado') ?? ''

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    try {
      setCargando(true)
      const [tareasData, listasData] = await Promise.all([
        tareasRepository.obtenerTareas(),
        listasRepository.obtenerListas(),
      ])
      setTareas(tareasData)
      setListas(listasData)
    } catch (err) {
      toast.error(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const actualizarFiltro = (clave, valor) => {
    const nuevos = new URLSearchParams(searchParams)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    setSearchParams(nuevos)
  }

  const nombreDeLista = (listaId) => listas.find((l) => l.id === listaId)?.nombre || ''

  const completar = async (tarea) => {
    if (tarea.completada) return
    try {
      await tareasRepository.completarTarea(tarea.id)
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err))
    }
  }

  const eliminarTarea = async (id) => {
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

  if (cargando) return <p className={styles.cargando}>Cargando tareas...</p>

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Todas las tareas</h1>
        <p className={styles.subtitulo}>Gestioná tu flujo de trabajo global desde un solo lugar.</p>
      </header>

      <BarraFiltros
        listas={listas}
        filtroLista={filtroLista}
        filtroPrioridad={filtroPrioridad}
        filtroEstado={filtroEstado}
        onCambiarFiltro={actualizarFiltro}
        onLimpiar={() => setSearchParams({})}
      />

      <PanelResumenMetricas metricas={metricasEstandarDeTareas(tareasFiltradas)} />

      <ListaTareas
        tareas={tareasFiltradas}
        onCompletar={completar}
        onEliminar={eliminarTarea}
        nombreDeLista={nombreDeLista}
      />
    </div>
  )
}
