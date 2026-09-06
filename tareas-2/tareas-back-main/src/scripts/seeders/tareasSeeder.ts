import { Cuenta } from '../../models/Cuenta.js';
import { Lista } from '../../models/lista.js';
import { Tarea } from '../../models/tarea.js';

export async function seedTareas() {
  const cantidad = await Tarea.count();
  if (cantidad > 0) {
    console.log('⚠️ Ya existen tareas. No se insertan datos iniciales.');
    return;
  }

  const cuentaDemo = await Cuenta.findOne({ where: { keycloakSub: 'seed-demo' } });
  if (!cuentaDemo) {
    console.log('⚠️ No existe la cuenta demo. No se insertan tareas iniciales.');
    return;
  }

  const general = await Lista.findOne({ where: { nombre: 'General', cuentaId: cuentaDemo.id } });
  const trabajo = await Lista.findOne({ where: { nombre: 'Trabajo', cuentaId: cuentaDemo.id } });
  const facultad = await Lista.findOne({ where: { nombre: 'Facultad', cuentaId: cuentaDemo.id } });
  const casa = await Lista.findOne({ where: { nombre: 'Casa', cuentaId: cuentaDemo.id } });
  const personal = await Lista.findOne({ where: { nombre: 'Personal', cuentaId: cuentaDemo.id } });

  if (!general || !trabajo || !facultad || !casa || !personal) {
    throw new Error('Faltan listas de la cuenta demo para inicializar tareas');
  }

  await Tarea.bulkCreate([
    {
      titulo: 'Revisar contrato de API',
      descripcion: 'Validar que el OpenAPI refleje correctamente los endpoints definidos',
      prioridad: 'alta',
      completada: false,
      fechaVencimiento: '2026-04-30',
      listaId: trabajo.id,
      etiquetas: ['api', 'backend'],
    },
    {
      titulo: 'Preparar clase de Sequelize',
      descripcion: 'Organizar ejemplo con modelos, relaciones y repositorios',
      prioridad: 'alta',
      completada: false,
      fechaVencimiento: '2026-05-02',
      listaId: facultad.id,
      etiquetas: ['docencia', 'sequelize'],
    },
    {
      titulo: 'Comprar insumos de limpieza',
      descripcion: 'Reponer elementos básicos para cocina y baño',
      prioridad: 'media',
      completada: false,
      fechaVencimiento: null,
      listaId: casa.id,
      etiquetas: ['hogar'],
    },
    {
      titulo: 'Leer documentación de Express',
      descripcion: 'Revisar routing, request, response y middlewares técnicos',
      prioridad: 'media',
      completada: true,
      fechaVencimiento: null,
      listaId: facultad.id,
      etiquetas: ['express', 'backend'],
    },
    {
      titulo: 'Organizar planificación semanal',
      descripcion: 'Revisar prioridades personales y laborales',
      prioridad: 'baja',
      completada: false,
      fechaVencimiento: '2026-05-01',
      listaId: personal.id,
      etiquetas: ['organizacion'],
    },
    {
      titulo: 'Revisar pendientes generales',
      descripcion: 'Agrupar tareas sin clasificación específica',
      prioridad: 'baja',
      completada: false,
      fechaVencimiento: null,
      listaId: general.id,
      etiquetas: [],
    },
  ]);
  console.log('✅ Tareas inicializadas correctamente');
}
