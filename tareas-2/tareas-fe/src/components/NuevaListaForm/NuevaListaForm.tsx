import { useState, type FormEvent } from 'react'
import { useAccion } from '../../hooks/useAccion'
import styles from './NuevaListaForm.module.css'
export default function NuevaListaForm({
  onCrear,
}: {
  onCrear: (nombre: string) => Promise<boolean>
}) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { ocupado, ejecutar } = useAccion()
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (nombre.trim().length < 3 || nombre.trim().length > 100) {
      setError('El nombre debe tener entre 3 y 100 caracteres')
      return
    }
    void ejecutar(async () => {
      setError(null)
      try {
        if (await onCrear(nombre.trim())) setNombre('')
        else
          setError(
            'No se pudo crear la lista. Conservamos el nombre para reintentar.',
          )
      } catch {
        setError('No se pudo crear la lista. Reintentá.')
      }
    })
  }
  return (
    <form className={styles.form} onSubmit={enviar} aria-busy={ocupado}>
      <input
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'nueva-lista-error' : undefined}
        aria-label="Nombre de la nueva lista"
        required
        minLength={3}
        maxLength={100}
        className={styles.input}
        placeholder="Nombre de la nueva lista..."
        value={nombre}
        disabled={ocupado}
        onChange={(e) => setNombre(e.target.value)}
      />
      <button className={styles.boton} type="submit" disabled={ocupado}>
        <span aria-hidden="true" className="material-symbols-outlined">
          add
        </span>
        {ocupado ? 'Creando...' : 'Crear'}
      </button>
      {error && (
        <p id="nueva-lista-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
