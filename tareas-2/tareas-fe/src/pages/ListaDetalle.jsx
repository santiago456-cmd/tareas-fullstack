// src/pages/ListaDetalle.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import listasRepository from '../repositories/listas.repository'
import tareasRepository from '../repositories/tareas.repository'
import { mensajeDeError } from '../repositories/errores'
import EncabezadoDetalleLista from '../components/EncabezadoDetalleLista/EncabezadoDetalleLista'
import PanelResumenMetricas, { metricasEstandarDeTareas } from '../components/PanelResumenMetricas/PanelResumenMetricas'
import ListaTareas from '../components/ListaTareas'
import styles from './ListaDetalle.module.css'

export default function ListaDetalle() {
  const { id } = useParams()
  const [lista, setLista] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const cargar = async () => {
    try {
      setCargando(true)
      const data = await listasRepository.obtenerListaConTareas(id)
      setLista(data)
    } catch (err) {
      toast.error(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const completar = async (tarea) => {
    if (tarea.completada) return
    try {
      await tareasRepository.completarTarea(tarea.id)
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err))
    }
  }

  const eliminarTarea = async (tareaId) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return
    try {
      await tareasRepository.eliminarTarea(tareaId)
      toast.success('Tarea eliminada')
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err))
    }
  }

  if (cargando) return <p className={styles.cargando}>Cargando...</p>
  if (!lista) return <p className={styles.cargando}>Lista no encontrada.</p>

  return (
    <div>
      <EncabezadoDetalleLista nombreLista={lista.nombre} listaId={lista.id} />
      <PanelResumenMetricas metricas={metricasEstandarDeTareas(lista.tareas)} />
      <ListaTareas tareas={lista.tareas} onCompletar={completar} onEliminar={eliminarTarea} />
    </div>
  )
}
