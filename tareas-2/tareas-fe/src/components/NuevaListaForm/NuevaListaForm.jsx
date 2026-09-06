// src/components/NuevaListaForm/NuevaListaForm.jsx
//
// Input + botón "Crear" agrupados en una píldora con sombra, tal como en el
// mockup de "Mis listas".
import { useState } from 'react'
import styles from './NuevaListaForm.module.css'

export default function NuevaListaForm({ onCrear }) {
  const [nombre, setNombre] = useState('')

  const enviar = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    onCrear(nombre.trim())
    setNombre('')
  }

  return (
    <form className={styles.form} onSubmit={enviar}>
      <input
        className={styles.input}
        placeholder="Nombre de la nueva lista..."
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <button className={styles.boton} type="submit">
        <span className="material-symbols-outlined">add</span>
        Crear
      </button>
    </form>
  )
}
