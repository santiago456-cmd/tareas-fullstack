import { useEffect, useRef } from 'react'
export function useVigente(key: string | undefined) {
  const current = useRef(key)
  const mounted = useRef(true)
  current.current = key
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return () => mounted.current && current.current === key
}
