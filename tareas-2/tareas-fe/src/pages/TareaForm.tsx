import { useCallback, useRef, useEffect } from 'react'
import { useVigente } from '../hooks/useVigente'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import tareasRepository from '../repositories/tareas.repository'
import { mensajeDeError } from '../repositories/errores'
import Modal from '../components/ui/Modal/Modal'
import Boton from '../components/ui/Boton/Boton'
import FormularioTarea from '../components/FormularioTarea/FormularioTarea'
import EstadoCarga from '../components/EstadoCarga'
import { normalizarEtiquetas } from '../utils/etiquetas'
import { useCarga } from '../hooks/useCarga'
import { useAccion } from '../hooks/useAccion'
import type { ValoresTarea, TareaInput } from '../types'
const ID_FORM = 'formulario-tarea'
export default function TareaForm() {
  const { id, listaId } = useParams()
  const navigate = useNavigate()
  const vigente = useVigente(id ?? listaId)
  const dirty = useRef(false)
  const setDirty = useCallback((value: boolean) => {
    dirty.current = value
  }, [])
  useEffect(() => {
    setDirty(false)
  }, [id, setDirty])
  const { ocupado, ejecutar } = useAccion()
  const loader = useCallback(async () => {
    if (id) {
      const tarea = await tareasRepository.obtenerTareaPorId(id)
      return {
        listaId: tarea.listaId,
        valores: {
          titulo: tarea.titulo,
          descripcion: tarea.descripcion ?? '',
          prioridad: tarea.prioridad ?? 'media',
          fechaVencimiento: tarea.fechaVencimiento?.slice(0, 10) ?? '',
          etiquetas: normalizarEtiquetas(tarea.etiquetas),
        },
      }
    }
    return {
      listaId: Number(listaId),
      valores: {
        titulo: '',
        descripcion: '',
        prioridad: 'media' as const,
        fechaVencimiento: '',
        etiquetas: [],
      },
    }
  }, [id, listaId])
  const { data, cargando, error, cargar } = useCarga(loader)
  const destino = data?.listaId ? `/listas/${data.listaId}` : '/tareas'
  const cerrar = () => {
    if (
      !ocupado &&
      (!dirty.current || window.confirm('¿Descartar los cambios sin guardar?'))
    )
      navigate(destino)
  }
  const onSubmit = async (valores: ValoresTarea) => {
    await ejecutar(async () => {
      const payload: Omit<TareaInput, 'listaId'> = {
        ...valores,
        descripcion: valores.descripcion || null,
        fechaVencimiento: valores.fechaVencimiento || null,
        etiquetas: normalizarEtiquetas(valores.etiquetas),
      }
      try {
        if (id) await tareasRepository.actualizarTarea(id, payload)
        else
          await tareasRepository.crearTarea({
            ...payload,
            listaId: Number(listaId),
          })
        if (!vigente()) return
        toast.success(id ? 'Tarea actualizada' : 'Tarea creada')
        navigate(destino)
      } catch (err) {
        if (vigente()) toast.error(mensajeDeError(err))
      }
    })
  }
  return (
    <Modal
      titulo={id ? 'Editar tarea' : 'Nueva tarea'}
      onClose={cerrar}
      ocupado={ocupado}
      footer={
        <>
          <Boton
            variant="primary"
            type="submit"
            form={ID_FORM}
            disabled={ocupado || cargando || Boolean(error)}
          >
            {ocupado ? 'Guardando...' : 'Guardar'}
          </Boton>
          <Boton
            variant="secondary"
            type="button"
            onClick={cerrar}
            disabled={ocupado}
          >
            Cancelar
          </Boton>
        </>
      }
    >
      {cargando || error || !data ? (
        <EstadoCarga error={error} reintentar={cargar} />
      ) : (
        <fieldset
          disabled={ocupado}
          style={{ border: 0, margin: 0, padding: 0 }}
        >
          <FormularioTarea
            key={id ?? `nueva-${listaId}`}
            id={ID_FORM}
            valoresIniciales={data.valores}
            onDirtyChange={setDirty}
            onSubmit={onSubmit}
          />
        </fieldset>
      )}
    </Modal>
  )
}
