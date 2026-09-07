const colores: Record<string, string> = {
  gris: '#64748b',
  azul: '#2563eb',
  violeta: '#7c3aed',
  verde: '#16a34a',
  naranja: '#ea580c',
  rojo: '#dc2626',
  amarillo: '#ca8a04',
  blanco: '#ffffff',
  negro: '#000000',
}
export function colorVisible(color: string | null): string {
  if (!color) return 'var(--color-primary)'
  const valor = colores[color.toLowerCase()] ?? color
  return CSS.supports('color', valor) ? valor : 'var(--color-primary)'
}
export function colorEditable(color: string | null): string {
  return color ? (colores[color.toLowerCase()] ?? color) : ''
}
