import { useCallback, useEffect, useRef, useState } from 'react'
import { mensajeDeError } from '../repositories/errores'
export function useCarga<T>(loader: () => Promise<T>) {
  const version = useRef(0)
  const [state, setState] = useState<{
    loader: typeof loader
    data: T | null
    error: string | null
    cargando: boolean
  }>({ loader, data: null, error: null, cargando: true })
  const cargar = useCallback(async () => {
    const current = ++version.current
    setState({ loader, data: null, error: null, cargando: true })
    try {
      const data = await loader()
      if (current === version.current)
        setState({ loader, data, error: null, cargando: false })
    } catch (err) {
      if (current === version.current)
        setState({
          loader,
          data: null,
          error: mensajeDeError(err),
          cargando: false,
        })
    }
  }, [loader])
  useEffect(() => {
    const counter = version
    void cargar()
    return () => {
      counter.current++
    }
  }, [cargar])
  return {
    ...(state.loader === loader
      ? state
      : { data: null, error: null, cargando: true }),
    cargar,
  }
}
