export type Prioridad = 'baja' | 'media' | 'alta'
export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
export interface Lista {
  id: number
  nombre: string
  descripcion: string | null
  color: string | null
  fechaCreacion: string
  cantidadTareas?: number
}
export interface Tarea {
  id: number
  listaId?: number
  titulo: string
  descripcion: string | null
  completada: boolean
  prioridad: Prioridad
  fechaVencimiento: string | null
  fechaCreacion: string
  etiquetas: string[]
}
export interface ListaDetalle extends Lista {
  tareas: Tarea[]
}
export interface ListaInput {
  nombre: string
  descripcion?: string | null
  color?: string | null
}
export interface TareaInput {
  titulo: string
  listaId: number
  descripcion: string | null
  prioridad: Prioridad
  fechaVencimiento: string | null
  etiquetas: string[]
}
export type TareaPatch = Partial<Omit<TareaInput, 'listaId'>>
export interface ValoresTarea {
  titulo: string
  descripcion: string
  prioridad: Prioridad
  fechaVencimiento: string
  etiquetas: string[]
}
export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
}
export interface ApiResponse<T> {
  success: true
  data: T
  message: string
  meta: PageMeta | null
  error: null
}
export type Id = string | number
export interface Metrica {
  etiqueta: string
  valor: number
  icon?: string
  tone?: Tone
}
