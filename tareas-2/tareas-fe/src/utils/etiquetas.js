export const MAX_ETIQUETAS = 20
export const MAX_ETIQUETA = 50

// Defensa ante datos históricos o una respuesta que incumpla el contrato API.
export function normalizarEtiquetas(valor) {
  if (!Array.isArray(valor)) return []
  return [
    ...new Set(
      valor
        .filter((v) => typeof v === 'string')
        .map((v) => v.trim())
        .filter((v) => v.length > 0 && v.length <= MAX_ETIQUETA),
    ),
  ].slice(0, MAX_ETIQUETAS)
}
