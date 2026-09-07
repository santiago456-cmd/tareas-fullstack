import { Navigate } from 'react-router-dom'
import { useSesion, iniciarLogin } from '../auth/oauth'

export default function AuthCallback() {
  const { autenticado, error } = useSesion()
  if (autenticado || !error) return <Navigate to="/listas" replace />
  return (
    <div role="alert">
      <h1>No se pudo iniciar sesión</h1>
      <p>{error || 'El ingreso no se completó.'}</p>
      <button onClick={iniciarLogin}>Volver a ingresar</button>
    </div>
  )
}
