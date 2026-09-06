// src/pages/Listas.jsx
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import listasRepository from '../repositories/listas.repository'
import { mensajeDeError } from '../repositories/errores'
import ListaCard from '../components/ListaCard/ListaCard'
import NuevaListaForm from '../components/NuevaListaForm/NuevaListaForm'
import styles from './Listas.module.css'

export default function Listas() {
  const [listas, setListas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    try {
      setCargando(true)
      const data = await listasRepository.obtenerListas()
      setListas(data)
    } catch (err) {
      toast.error(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const crear = async (nombre) => {
    try {
      await listasRepository.crearLista({ nombre })
      toast.success('Lista creada')
      cargar()
    } catch (err) {
      toast.error(mensajeDeError(err)) // ej: "Ya existe una lista con ese nombre"
    }
  }

  const editar = (id) => {
    window.location.href = `/listas/${id}/editar`
  }

  const eliminar = async (id) => {
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

  if (cargando) return <p className={styles.cargando}>Cargando listas...</p>

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Mis listas</h1>
          <p className={styles.subtitulo}>Organiza tus tareas en grupos temáticos.</p>
        </div>
        <NuevaListaForm onCrear={crear} />
      </div>

      {listas.length === 0 ? (
        <p className={styles.vacio}>Todavía no tenés listas. Creá la primera arriba.</p>
      ) : (
        <div className={styles.grid}>
          {listas.map((l) => (
            <ListaCard key={l.id} lista={l} onEditar={editar} onEliminar={eliminar} />
          ))}
        </div>
      )}
    </div>
  )
}
