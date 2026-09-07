export default function EstadoCarga({
  error,
  reintentar,
}: {
  error?: string | null
  reintentar?: () => void
}) {
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={reintentar}>
          Reintentar
        </button>
      </div>
    )
  return <p role="status">Cargando...</p>
}
