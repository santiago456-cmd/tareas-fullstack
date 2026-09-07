import type { TareaInput, Lista, ValoresTarea } from '../../src/types'
import Boton from '../../src/components/ui/Boton/Boton'
import repository from '../../src/repositories/tareas.repository'
function contratos(input: TareaInput, lista: Lista, valores: ValoresTarea) {
  // @ts-expect-error las tareas nuevas requieren listaId
  const incompleta: TareaInput = { titulo: 'Tarea' }
  // @ts-expect-error prioridad cerrada
  valores.prioridad = 'urgente'
  // @ts-expect-error etiquetas no admite texto plano
  input.etiquetas = 'etiqueta'
  // @ts-expect-error no se cambia de lista mediante PATCH
  void repository.actualizarTarea(1, { listaId: 2 })
  // @ts-expect-error la descripción puede ser null
  lista.descripcion.trim()
  // @ts-expect-error variante inexistente
  const boton = <Boton variant="desconocida" />
  return [incompleta, boton]
}
void contratos
