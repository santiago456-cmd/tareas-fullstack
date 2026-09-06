// src/pages/ListaForm.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import listasRepository from '../repositories/listas.repository'
import { mensajeDeError } from '../repositories/errores'
import Modal from '../components/ui/Modal/Modal'
import Boton from '../components/ui/Boton/Boton'
import formStyles from '../components/FormularioTarea/FormularioTarea.module.css'

const ID_FORM = 'formulario-lista'

export default function ListaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cargado, setCargado] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    listasRepository
      .obtenerListaPorId(id)
      .then((lista) => {
        setValue('nombre', lista.nombre)
        setValue('descripcion', lista.descripcion ?? '')
        setValue('color', lista.color ?? '#3525cd')
        setCargado(true)
      })
      .catch((err) => toast.error(mensajeDeError(err)))
  }, [id, setValue])

  const cerrar = () => navigate('/listas')

  const onSubmit = async (datos) => {
    try {
      await listasRepository.actualizarLista(id, {
        nombre: datos.nombre,
        descripcion: datos.descripcion || null,
        color: datos.color || null,
      })
      toast.success('Lista actualizada')
      navigate('/listas')
    } catch (err) {
      // El backend revalida (nombre 3-100, nombre único) y puede responder 400/409.
      toast.error(mensajeDeError(err))
    }
  }

  if (!cargado) return null

  return (
    <Modal
      titulo="Editar lista"
      onClose={cerrar}
      footer={
        <>
          <Boton variant="primary" type="submit" form={ID_FORM}>Guardar</Boton>
          <Boton variant="secondary" type="button" onClick={cerrar}>Cancelar</Boton>
        </>
      }
    >
      <form id={ID_FORM} onSubmit={handleSubmit(onSubmit)} className={formStyles.form}>
        <div className={formStyles.campo}>
          <label className={formStyles.label} htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            className={formStyles.input}
            {...register('nombre', {
              required: 'El nombre es obligatorio',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              maxLength: { value: 100, message: 'Máximo 100 caracteres' },
            })}
          />
          {errors.nombre && <span className={formStyles.error}>{errors.nombre.message}</span>}
        </div>

        <div className={formStyles.campo}>
          <label className={formStyles.label} htmlFor="descripcion">Descripción</label>
          <textarea id="descripcion" className={formStyles.textarea} rows={3} {...register('descripcion')} />
        </div>

        <div className={formStyles.campo}>
          <label className={formStyles.label} htmlFor="color">Color</label>
          <input id="color" type="color" {...register('color')} style={{ width: 56, height: 40, padding: 0, border: 'none', background: 'none' }} />
        </div>
      </form>
    </Modal>
  )
}
