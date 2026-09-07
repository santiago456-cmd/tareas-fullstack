import { useRef, useState } from 'react'
export function useAccion() {
  const lock = useRef(false)
  const [ocupado, setOcupado] = useState(false)
  async function ejecutar<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (lock.current) return undefined
    lock.current = true
    setOcupado(true)
    try {
      return await action()
    } finally {
      lock.current = false
      setOcupado(false)
    }
  }
  return { ocupado, ejecutar }
}
