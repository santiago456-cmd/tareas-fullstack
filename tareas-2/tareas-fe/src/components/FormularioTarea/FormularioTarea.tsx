import { useEffect } from 'react'
import type { ValoresTarea } from '../../types'
// src/components/FormularioTarea/FormularioTarea.tsx
//
// Campos del formulario de nueva/editar tarea. Se usa dentro de <Modal>
// (ver src/pages/TareaForm.tsx). Cubre el body completo que acepta
// api-tareas: titulo, descripcion, prioridad, fechaVencimiento y etiquetas.
import { useForm, Controller } from 'react-hook-form'
import SelectorPrioridad from '../SelectorPrioridad/SelectorPrioridad'
import EtiquetasInput from '../EtiquetasInput/EtiquetasInput'
import styles from './FormularioTarea.module.css'

const VALORES_POR_DEFECTO: ValoresTarea = {
  titulo: '',
  descripcion: '',
  prioridad: 'media',
  fechaVencimiento: '',
  etiquetas: [],
}

export default function FormularioTarea({
  valoresIniciales,
  onSubmit,
  onDirtyChange,
  id = 'formulario-tarea',
}: {
  onDirtyChange?: (v: boolean) => void
  valoresIniciales?: ValoresTarea
  onSubmit: (v: ValoresTarea) => Promise<void>
  id?: string
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<ValoresTarea>({
    defaultValues: { ...VALORES_POR_DEFECTO, ...valoresIniciales },
  })

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  return (
    <form
      id={id}
      onChangeCapture={() => onDirtyChange?.(true)}
      onSubmit={handleSubmit(onSubmit)}
      className={styles.form}
    >
      <div className={styles.campo}>
        <label className={styles.label} htmlFor="titulo">
          Título
        </label>
        <input
          autoFocus
          id="titulo"
          aria-invalid={Boolean(errors.titulo)}
          aria-describedby={errors.titulo ? 'titulo-error' : undefined}
          className={styles.input}
          placeholder="Ej: Revisar informe trimestral"
          {...register('titulo', {
            required: 'El título es obligatorio',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            maxLength: { value: 150, message: 'Máximo 150 caracteres' },
          })}
        />
        {errors.titulo && (
          <span id="titulo-error" role="alert" className={styles.error}>
            {errors.titulo.message}
          </span>
        )}
      </div>

      <div className={styles.campo}>
        <label className={styles.label} htmlFor="descripcion">
          Descripción
        </label>
        <textarea
          id="descripcion"
          className={styles.textarea}
          rows={4}
          placeholder="Añade detalles sobre esta tarea..."
          maxLength={500}
          {...register('descripcion', { maxLength: 500 })}
        />
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Controller
            name="prioridad"
            control={control}
            render={({ field }) => (
              <SelectorPrioridad
                valor={field.value}
                onChange={(value) => {
                  field.onChange(value)
                  onDirtyChange?.(true)
                }}
              />
            )}
          />
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="fechaVencimiento">
            Fecha de vencimiento
          </label>
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
            <EtiquetasInput
              valor={field.value}
              onChange={(value) => {
                field.onChange(value)
                onDirtyChange?.(true)
              }}
            />
          )}
        />
      </div>
    </form>
  )
}
