import { colorEditable } from '../utils/colores'
import { useCallback, useRef, useEffect } from 'react'
import { useVigente } from '../hooks/useVigente'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import listasRepository from '../repositories/listas.repository'
import { mensajeDeError } from '../repositories/errores'
import Modal from '../components/ui/Modal/Modal'
import Boton from '../components/ui/Boton/Boton'
import EstadoCarga from '../components/EstadoCarga'
import { useCarga } from '../hooks/useCarga'
import { useAccion } from '../hooks/useAccion'
import type { Lista } from '../types'
import styles from '../components/FormularioTarea/FormularioTarea.module.css'
type Valores = { nombre: string; descripcion: string; color: string }
function Campos({
  lista,
  onSubmit,
  ocupado,
  onDirtyChange,
}: {
  onDirtyChange: (v: boolean) => void
  lista: Lista
  onSubmit: (v: Valores) => Promise<void>
  ocupado: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Valores>({
    defaultValues: {
      nombre: lista.nombre,
      descripcion: lista.descripcion ?? '',
      color: colorEditable(lista.color),
    },
  })
  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])
  return (
    <form
      id="formulario-lista"
      onChangeCapture={() => onDirtyChange(true)}
      onSubmit={handleSubmit(onSubmit)}
      className={styles.form}
    >
      <fieldset disabled={ocupado} style={{ border: 0, padding: 0 }}>
        <div className={styles.campo}>
          <label htmlFor="nombre">Nombre</label>
          <input
            autoFocus
            id="nombre"
            className={styles.input}
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? 'nombre-error' : undefined}
            {...register('nombre', {
              required: 'El nombre es obligatorio',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              maxLength: { value: 100, message: 'Máximo 100 caracteres' },
            })}
          />
          {errors.nombre && (
            <span id="nombre-error" role="alert">
              {errors.nombre.message}
            </span>
          )}
        </div>
        <div className={styles.campo}>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            className={styles.textarea}
            maxLength={250}
            {...register('descripcion', { maxLength: 250 })}
          />
        </div>
        <div className={styles.campo}>
          <label htmlFor="color">Color</label>
          <input
            aria-invalid={Boolean(errors.color)}
            aria-describedby={errors.color ? 'color-error' : undefined}
            id="color"
            className={styles.input}
            placeholder="#3525cd o un color CSS"
            maxLength={30}
            {...register('color', {
              validate: (value) =>
                !value ||
                CSS.supports('color', value) ||
                'Ingresá un color CSS válido',
            })}
          />
          {errors.color && (
            <span role="alert" id="color-error">
              {errors.color.message}
            </span>
          )}
          <small>Dejá vacío para usar el color predeterminado.</small>
        </div>
      </fieldset>
    </form>
  )
}
export default function ListaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vigente = useVigente(id)
  const dirty = useRef(false)
  const setDirty = useCallback((value: boolean) => {
    dirty.current = value
  }, [])
  useEffect(() => {
    setDirty(false)
  }, [id, setDirty])
  const { ocupado, ejecutar } = useAccion()
  const loader = useCallback(() => {
    if (!id) throw new Error('Lista inválida')
    return listasRepository.obtenerListaPorId(id)
  }, [id])
  const { data, cargando, error, cargar } = useCarga(loader)
  const cerrar = () => {
    if (
      !ocupado &&
      (!dirty.current || window.confirm('¿Descartar los cambios sin guardar?'))
    )
      navigate('/listas')
  }
  const onSubmit = async (valores: Valores) => {
    if (!id) return
    await ejecutar(async () => {
      try {
        await listasRepository.actualizarLista(id, {
          nombre: valores.nombre,
          descripcion: valores.descripcion || null,
          color: valores.color || null,
        })
        if (!vigente()) return
        toast.success('Lista actualizada')
        navigate('/listas')
      } catch (err) {
        if (vigente()) toast.error(mensajeDeError(err))
      }
    })
  }
  return (
    <Modal
      titulo="Editar lista"
      onClose={cerrar}
      ocupado={ocupado}
      footer={
        <>
          <Boton
            type="submit"
            form="formulario-lista"
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
        <Campos
          onDirtyChange={setDirty}
          key={data.id}
          lista={data}
          ocupado={ocupado}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  )
}
