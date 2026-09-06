// src/pages/TareaForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import tareasRepository from '../repositories/tareas.repository'
import { mensajeDeError } from '../repositories/errores'
import Modal from '../components/ui/Modal/Modal'
import Boton from '../components/ui/Boton/Boton'
import FormularioTarea from '../components/FormularioTarea/FormularioTarea'
import { normalizarEtiquetas } from '../utils/etiquetas'

const ID_FORM = 'formulario-tarea'

// api-tareas devuelve fechaVencimiento como ISO string (o null); el input
// type="date" necesita el formato yyyy-mm-dd.
function aInputFecha(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export default function TareaForm() {
  const { id, listaId } = useParams()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const [valoresIniciales, setValoresIniciales] = useState(
    esEdicion
      ? null
      : {
          titulo: '',
          descripcion: '',
          prioridad: 'media',
          fechaVencimiento: '',
          etiquetas: [],
        },
  )

  useEffect(() => {
    if (esEdicion) {
      tareasRepository
        .obtenerTareaPorId(id)
        .then((tarea) =>
          setValoresIniciales({
            titulo: tarea.titulo,
            descripcion: tarea.descripcion ?? '',
            prioridad: tarea.prioridad ?? 'media',
            fechaVencimiento: aInputFecha(tarea.fechaVencimiento),
            etiquetas: normalizarEtiquetas(tarea.etiquetas),
          }),
        )
        .catch((err) => toast.error(mensajeDeError(err)))
    }
  }, [id, esEdicion])

  const cerrar = () => navigate(-1)

  const onSubmit = async (datos) => {
    const payload = {
      titulo: datos.titulo,
      descripcion: datos.descripcion || null,
      prioridad: datos.prioridad || 'media',
      fechaVencimiento: datos.fechaVencimiento || null,
      etiquetas: normalizarEtiquetas(datos.etiquetas),
    }

    try {
      if (esEdicion) {
        await tareasRepository.actualizarTarea(id, payload)
        toast.success('Tarea actualizada')
        navigate(-1)
      } else {
        await tareasRepository.crearTarea({
          ...payload,
          listaId: Number(listaId),
        })
        toast.success('Tarea creada')
        navigate(`/listas/${listaId}`)
      }
    } catch (err) {
      // El backend revalida y puede responder 400: mostramos su mensaje.
      toast.error(mensajeDeError(err))
    }
  }

  if (esEdicion && !valoresIniciales) return null // esperando cargar datos

  return (
    <Modal
      titulo={esEdicion ? 'Editar tarea' : 'Nueva tarea'}
      onClose={cerrar}
      footer={
        <>
          <Boton variant="primary" type="submit" form={ID_FORM}>
            Guardar
          </Boton>
          <Boton variant="secondary" type="button" onClick={cerrar}>
            Cancelar
          </Boton>
        </>
      }
    >
      <FormularioTarea
        id={ID_FORM}
        valoresIniciales={valoresIniciales}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
