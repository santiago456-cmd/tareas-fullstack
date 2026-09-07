import { colorVisible } from '../utils/colores'
// src/pages/ListaDetalle.tsx
import { useCallback } from 'react'
import { useCarga } from '../hooks/useCarga'
import EstadoCarga from '../components/EstadoCarga'
import type { Tarea } from '../types'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import listasRepository from '../repositories/listas.repository'
import tareasRepository from '../repositories/tareas.repository'
import { mensajeDeError } from '../repositories/errores'
import EncabezadoDetalleLista from '../components/EncabezadoDetalleLista/EncabezadoDetalleLista'
import PanelResumenMetricas, {
  metricasEstandarDeTareas,
} from '../components/PanelResumenMetricas/PanelResumenMetricas'
import ListaTareas from '../components/ListaTareas'
import styles from './ListaDetalle.module.css'

export default function ListaDetalle() {
  const { id } = useParams()
  const loader = useCallback(() => {
    if (!id) throw new Error('Lista inválida')
    return listasRepository.obtenerListaConTareas(id)
  }, [id])
  const { data: lista, cargando, error, cargar } = useCarga(loader)

  const completar = async (tarea: Tarea) => {
    if (tarea.completada) return
    try {
      await tareasRepository.completarTarea(tarea.id)
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err))
    }
  }

  const eliminarTarea = async (tareaId: number) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return
    try {
      await tareasRepository.eliminarTarea(tareaId)
      toast.success('Tarea eliminada')
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err))
    }
  }

  if (cargando || error)
    return <EstadoCarga error={error} reintentar={cargar} />
  if (!lista) return <p className={styles.cargando}>Lista no encontrada.</p>

  return (
    <div style={{ borderTop: `4px solid ${colorVisible(lista.color)}` }}>
      <EncabezadoDetalleLista nombreLista={lista.nombre} listaId={lista.id} />
      {lista.descripcion && <p>{lista.descripcion}</p>}
      <PanelResumenMetricas metricas={metricasEstandarDeTareas(lista.tareas)} />
      <ListaTareas
        tareas={lista.tareas}
        onCompletar={completar}
        onEliminar={eliminarTarea}
      />
    </div>
  )
}
