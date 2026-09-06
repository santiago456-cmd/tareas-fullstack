import { Cuenta } from '../../models/Cuenta.js';
import { Lista } from '../../models/lista.js';

export async function seedListas() {
  const cantidad = await Lista.count();

  if (cantidad > 0) {
    console.log('⚠️ Ya existen listas. No se insertan datos iniciales.');
    return;
  }

  let cuentaDemo = await Cuenta.findOne({ where: { keycloakSub: 'seed-demo' } });
  if (!cuentaDemo) {
    cuentaDemo = await Cuenta.create({
      keycloakSub: 'seed-demo',
      username: 'seed-demo',
      email: 'seed-demo@example.com',
    });
  }

  await Lista.bulkCreate([
    {
      nombre: 'General',
      descripcion: 'Lista por defecto para tareas sin una clasificación específica',
      color: 'gris',
      cuentaId: cuentaDemo.id,
    },
    {
      nombre: 'Trabajo',
      descripcion: 'Tareas relacionadas con proyectos laborales o profesionales',
      color: 'azul',
      cuentaId: cuentaDemo.id,
    },
    {
      nombre: 'Facultad',
      descripcion: 'Tareas vinculadas con clases, apuntes, evaluaciones y actividades académicas',
      color: 'violeta',
      cuentaId: cuentaDemo.id,
    },

    {
      nombre: 'Casa',
      descripcion: 'Tareas domésticas y de organización del hogar',
      color: 'verde',
      cuentaId: cuentaDemo.id,
    },
    {
      nombre: 'Personal',
      descripcion: 'Tareas personales, hábitos, salud y organización individual',
      color: 'naranja',
      cuentaId: cuentaDemo.id,
    },
  ]);
  console.log('✅ Listas inicializadas correctamente');
}
