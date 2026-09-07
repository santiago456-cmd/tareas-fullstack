// src/pages/Listas.tsx
import { useCallback } from 'react'
import { useCarga } from '../hooks/useCarga'
import EstadoCarga from '../components/EstadoCarga'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import listasRepository from '../repositories/listas.repository'
import { mensajeDeError } from '../repositories/errores'
import ListaCard from '../components/ListaCard/ListaCard'
import NuevaListaForm from '../components/NuevaListaForm/NuevaListaForm'
import styles from './Listas.module.css'

export default function Listas() {
  const navigate = useNavigate()
  const loader = useCallback(() => listasRepository.obtenerListas(), [])
  const { data, cargando, error, cargar } = useCarga(loader)
  const listas = data ?? []

  const crear = async (nombre: string) => {
    try {
      await listasRepository.crearLista({ nombre })
      toast.success('Lista creada')
      await cargar()
      return true
    } catch (err) {
      toast.error(mensajeDeError(err))
      return false
    }
  }

  const editar = (id: number) => {
    navigate(`/listas/${id}/editar`)
  }

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar esta lista?')) return
    try {
      await listasRepository.eliminarLista(id)
      toast.success('Lista eliminada')
      cargar()
    } catch (err) {
      // ej: "No se puede eliminar la lista porque tiene tareas pendientes"
      toast.error(mensajeDeError(err))
    }
  }

  if (cargando || error)
    return <EstadoCarga error={error} reintentar={cargar} />

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Mis listas</h1>
          <p className={styles.subtitulo}>
            Organiza tus tareas en grupos temáticos.
          </p>
        </div>
        <NuevaListaForm onCrear={crear} />
      </div>

      {listas.length === 0 ? (
        <p className={styles.vacio}>
          Todavía no tenés listas. Creá la primera arriba.
        </p>
      ) : (
        <div className={styles.grid}>
          {listas.map((l) => (
            <ListaCard
              key={l.id}
              lista={l}
              onEditar={editar}
              onEliminar={eliminar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
