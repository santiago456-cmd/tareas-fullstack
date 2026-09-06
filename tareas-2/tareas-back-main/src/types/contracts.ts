export type Prioridad = 'baja' | 'media' | 'alta';
export interface ListaInput {
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
}
export interface TareaInput {
  titulo: string;
  listaId: number;
  descripcion?: string | null;
  prioridad?: Prioridad;
  fechaVencimiento?: string | null;
  etiquetas?: string[];
}
export type TareaPatch = Partial<Omit<TareaInput, 'listaId'>>;
export interface UsuarioAutenticado {
  id: string;
  username?: string;
  email?: string;
  roles: string[];
}
export interface Failure {
  ok: false;
  status: number;
  code: string;
  message: string;
  details?: unknown;
}
export type ServiceResult<T> =
  | { ok: true; status: number; data: T; meta?: import('../validation/paginacion.js').PageMeta }
  | Failure;
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T | null;
  meta: unknown;
  error: null;
}
export interface ApiFailure {
  success: false;
  message: string;
  data: null;
  meta: null;
  error: { code: string; details: unknown };
}
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure;
export interface ListaView {
  id: number;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  fechaCreacion: Date;
}
export interface TareaView {
  id: number;
  titulo: string;
  descripcion: string | null;
  completada: boolean;
  prioridad: Prioridad;
  fechaVencimiento: string | null;
  fechaCreacion: Date;
  etiquetas: string[];
}
