// src/components/FormularioTarea/FormularioTarea.jsx
//
// Campos del formulario de nueva/editar tarea. Se usa dentro de <Modal>
// (ver src/pages/TareaForm.jsx). Cubre el body completo que acepta
// api-tareas: titulo, descripcion, prioridad, fechaVencimiento y etiquetas.
import { useForm, Controller } from 'react-hook-form'
import SelectorPrioridad from '../SelectorPrioridad/SelectorPrioridad'
import EtiquetasInput from '../EtiquetasInput/EtiquetasInput'
import styles from './FormularioTarea.module.css'

const VALORES_POR_DEFECTO = {
  titulo: '',
  descripcion: '',
  prioridad: 'media',
  fechaVencimiento: '',
  etiquetas: [],
}

export default function FormularioTarea({ valoresIniciales, onSubmit, id = 'formulario-tarea' }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ defaultValues: { ...VALORES_POR_DEFECTO, ...valoresIniciales } })

  return (
    <form id={id} onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.campo}>
        <label className={styles.label} htmlFor="titulo">Título</label>
        <input
          id="titulo"
          className={styles.input}
          placeholder="Ej: Revisar informe trimestral"
          {...register('titulo', {
            required: 'El título es obligatorio',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            maxLength: { value: 150, message: 'Máximo 150 caracteres' },
          })}
        />
        {errors.titulo && <span className={styles.error}>{errors.titulo.message}</span>}
      </div>

      <div className={styles.campo}>
        <label className={styles.label} htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          className={styles.textarea}
          rows={4}
          placeholder="Añade detalles sobre esta tarea..."
          {...register('descripcion')}
        />
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <label className={styles.label}>Prioridad</label>
          <Controller
            name="prioridad"
            control={control}
            render={({ field }) => (
              <SelectorPrioridad valor={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="fechaVencimiento">Fecha de vencimiento</label>
          <input
            id="fechaVencimiento"
            type="date"
            className={styles.input}
            {...register('fechaVencimiento')}
          />
        </div>
      </div>

      <div className={styles.campo}>
        <label className={styles.label}>Etiquetas</label>
        <Controller
          name="etiquetas"
          control={control}
          render={({ field }) => (
            <EtiquetasInput valor={field.value} onChange={field.onChange} />
          )}
        />
      </div>
    </form>
  )
}
