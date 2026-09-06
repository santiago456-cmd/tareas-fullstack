import { ListasRepository } from '../../src/repositories/listasRepository.js';
import { TareasRepository } from '../../src/repositories/tareasRepository.js';
import { validarLista, validarTarea } from '../../src/validation/recursos.js';
import type { ApiRequest } from '../../src/types/http.js';
import type { ServiceResult, TareaPatch, UsuarioAutenticado } from '../../src/types/contracts.js';

// Aserciones de compilación: si un límite se vuelve any o pierde su contrato,
// TypeScript informa que el @ts-expect-error ya no corresponde a un error.
function contracts(req: ApiRequest, result: ServiceResult<{ id: number }>) {
  const lista = validarLista(req.body);
  const tarea = validarTarea(req.body);
  const nombre: string = lista.nombre;
  const listaId: number = tarea.listaId;
  const patch: TareaPatch = validarTarea(req.body, { parcial: true });
  // @ts-expect-error El cuerpo HTTP no se usa antes de validar.
  const titulo = req.body.titulo;
  // @ts-expect-error La autenticación y resolución de cuenta no están garantizadas en cualquier ruta.
  const cuentaId = req.cuenta.id;
  // @ts-expect-error No se permite mover una tarea con PATCH.
  const move: TareaPatch = { listaId: 2 };
  // @ts-expect-error El repositorio exige nombre y propietario.
  void new ListasRepository().crear({ cuentaId: 1 });
  // @ts-expect-error El repositorio exige listaId al crear tareas.
  void new TareasRepository().create({ titulo: 'Tarea válida' });
  // @ts-expect-error Las etiquetas públicas son textos.
  void new TareasRepository().create({ titulo: 'Tarea válida', listaId: 1, etiquetas: [3] });
  // @ts-expect-error La identidad requiere un subject validado.
  const usuario: UsuarioAutenticado = { roles: [] };
  if (!result.ok) {
    // @ts-expect-error Un resultado fallido no expone data.
    const data = result.data;
    void data;
  }
  return { nombre, listaId, patch, titulo, cuentaId, move, usuario };
}
void contracts;
