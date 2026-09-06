import { test, beforeEach, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { testDatabase } from './helpers/database.js';

const db = await testDatabase();
const { Cuenta } = await import('../src/models/Cuenta.js');
const { Lista } = await import('../src/models/lista.js');
const { Tarea } = await import('../src/models/tarea.js');
const { CuentasService } = await import('../src/services/CuentasService.js');
const { ListasService } = await import('../src/services/listasService.js');
const { TareasService } = await import('../src/services/TareasService.js');
const { ListasRepository } = await import('../src/repositories/listasRepository.js');
const { withWriteTransaction } = await import('../src/config/transactions.js');
const { normalizarEtiquetasGuardadas } =
  await import('../src/services/normalizarEtiquetasService.js');
const { crearRespaldo } = await import('../src/services/backupService.js');
const { Sequelize, UniqueConstraintError } = await import('sequelize');
const cuentas = new CuentasService();
const listas = new ListasService();
const tareas = new TareasService();
beforeEach(() => db.reset());
afterEach(() => mock.restoreAll());
after(() => db.close());

async function fixture() {
  const a = await Cuenta.create({ keycloakSub: 'alice', username: 'alice' });
  const b = await Cuenta.create({ keycloakSub: 'bob', username: 'bob' });
  const lista = (await listas.crearLista(a.id, { nombre: 'Mi lista' })).data;
  const tarea = (await tareas.crearTarea(a.id, { titulo: 'Mi tarea', listaId: lista.id })).data;
  return { a, b, lista, tarea };
}

test('WAL y FULL se usan tanto en conexión principal como transaccional', async () => {
  const [mode] = await db.sequelize.query('PRAGMA journal_mode');
  const [sync] = await db.sequelize.query('PRAGMA synchronous');
  assert.equal(mode[0].journal_mode, 'wal');
  assert.equal(sync[0].synchronous, 2);
  await withWriteTransaction(async (transaction) => {
    const [txSync] = await db.sequelize.query('PRAGMA synchronous', { transaction });
    assert.equal(txSync[0].synchronous, 2);
  });
});

test('Un respaldo restaura tablas, datos e integridad sin copiar un WAL activo', async () => {
  await fixture();
  const destino = join(db.directory, 'respaldo.sqlite');
  await crearRespaldo(destino);
  await assert.rejects(crearRespaldo(destino));
  const restored = new Sequelize({ dialect: 'sqlite', storage: destino, logging: false });
  try {
    const [integrity] = await restored.query('PRAGMA integrity_check');
    const [rows] = await restored.query('SELECT TITULO FROM TAREAS');
    assert.equal(integrity[0].integrity_check, 'ok');
    assert.deepEqual(rows, [{ TITULO: 'Mi tarea' }]);
  } finally {
    await restored.close();
  }
});

test('Aislamiento: lectura, alta, cambios y borrados de recursos ajenos', async () => {
  const { a, b, lista, tarea } = await fixture();
  assert.equal(await listas.obtenerListaPorId(b.id, lista.id), null);
  assert.equal(await listas.obtenerListaConTareas(b.id, lista.id), null);
  assert.equal(await tareas.obtenerTareaPorId(b.id, tarea.id), null);
  assert.equal((await tareas.obtenerTareas(b.id)).data.length, 0);
  for (const resultado of await Promise.all([
    listas.actualizarLista(b.id, lista.id, { nombre: 'Ajena' }),
    listas.eliminarLista(b.id, lista.id),
    tareas.crearTarea(b.id, { titulo: 'Ajena', listaId: lista.id }),
    tareas.actualizarTarea(b.id, tarea.id, { titulo: 'Ajena' }),
    tareas.completarTarea(b.id, tarea.id),
    tareas.eliminarTarea(b.id, tarea.id),
  ]))
    assert.equal(resultado.status, 404);
  assert.equal((await tareas.obtenerTareaPorId(a.id, tarea.id)).titulo, 'Mi tarea');
});

test('Alta concurrente de cuenta crea una sola cuenta y exactamente dos listas', async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      cuentas.resolverDesdeUsuario({ id: 'nuevo', username: 'nuevo' })
    )
  );
  assert.equal(new Set(results.map((c) => c.id)).size, 1);
  assert.equal(await Cuenta.count(), 1);
  assert.equal(await Lista.count(), 2);
});

test('Fallo en segunda lista de bienvenida revierte cuenta y primera lista; el reintento funciona', async () => {
  const original = Lista.create.bind(Lista);
  let calls = 0;
  mock.method(Lista, 'create', async (...args) => {
    if (++calls === 2) throw new Error('fallo de escritura');
    return original(...args);
  });
  await assert.rejects(cuentas.resolverDesdeUsuario({ id: 'nuevo', username: 'nuevo' }));
  assert.equal(await Cuenta.count(), 0);
  assert.equal(await Lista.count(), 0);
  mock.restoreAll();
  await cuentas.resolverDesdeUsuario({ id: 'nuevo', username: 'nuevo' });
  assert.equal(await Cuenta.count(), 1);
  assert.equal(await Lista.count(), 2);
});

test('Una cuenta existente no vuelve a recibir listas que el usuario eliminó', async () => {
  const c = await cuentas.resolverDesdeUsuario({ id: 'nuevo', username: 'nuevo' });
  for (const l of await Lista.findAll()) await listas.eliminarLista(c.id, l.id);
  await cuentas.resolverDesdeUsuario({ id: 'nuevo', username: 'nuevo' });
  assert.equal(await Lista.count(), 0);
});

test('Creaciones y cambios de nombre concurrentes devuelven un éxito y un conflicto', async () => {
  const { a } = await fixture();
  const create = await Promise.allSettled([
    listas.crearLista(a.id, { nombre: 'Duplicada' }),
    listas.crearLista(a.id, { nombre: 'Duplicada' }),
  ]);
  assert.equal(create.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(create.find((r) => r.status === 'rejected').reason.status, 409);
  const x = (await listas.crearLista(a.id, { nombre: 'Primera' })).data;
  const y = (await listas.crearLista(a.id, { nombre: 'Segunda' })).data;
  const updates = await Promise.allSettled([
    listas.actualizarLista(a.id, x.id, { nombre: 'Mismo nombre' }),
    listas.actualizarLista(a.id, y.id, { nombre: 'Mismo nombre' }),
  ]);
  assert.equal(updates.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(updates.find((r) => r.status === 'rejected').reason.code, 'LISTA_DUPLICADA');
});

test('La restricción única del ORM también se traduce cuando falla después de la consulta previa', async () => {
  const { a } = await fixture();
  const repo = new ListasRepository();
  repo.crear = async () => {
    throw new UniqueConstraintError({ message: 'detalle interno' });
  };
  await assert.rejects(
    new ListasService({ listasRepository: repo }).crearLista(a.id, { nombre: 'Conflicto' }),
    (e) => e.status === 409 && e.code === 'LISTA_DUPLICADA' && !e.message.includes('interno')
  );
});

test('Borrado con pendientes no cambia datos; completar dos veces respeta el conflicto', async () => {
  const { a, lista, tarea } = await fixture();
  assert.equal((await listas.eliminarLista(a.id, lista.id)).status, 409);
  const completed = await Promise.all([
    tareas.completarTarea(a.id, tarea.id),
    tareas.completarTarea(a.id, tarea.id),
  ]);
  assert.deepEqual(completed.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await listas.eliminarLista(a.id, lista.id)).status, 200);
  assert.equal(await Lista.count(), 0);
  assert.equal(await Tarea.count(), 0);
});

test('Fallo al borrar la lista restaura también las tareas completadas eliminadas', async () => {
  const { a, lista, tarea } = await fixture();
  await tareas.completarTarea(a.id, tarea.id);
  const repo = new ListasRepository();
  repo.eliminar = async (_lista, options) => {
    assert.ok(options.transaction);
    throw new Error('fallo al borrar');
  };
  await assert.rejects(new ListasService({ listasRepository: repo }).eliminarLista(a.id, lista.id));
  assert.ok(await Lista.findByPk(lista.id));
  assert.ok(await Tarea.findByPk(tarea.id));
  assert.equal((await listas.eliminarLista(a.id, lista.id)).status, 200);
});

test('Alta de tarea y borrado de lista concurrentes no dejan huérfanos ni pierden pendientes', async () => {
  const { a } = await fixture();
  const l = (await listas.crearLista(a.id, { nombre: 'Concurrencia' })).data;
  const [created, deleted] = await Promise.all([
    tareas.crearTarea(a.id, { titulo: 'Nueva pendiente', listaId: l.id }),
    listas.eliminarLista(a.id, l.id),
  ]);
  assert.equal(created.status, 201);
  assert.equal(deleted.status, 409);
  assert.ok(await Tarea.findByPk(created.data.id));
  assert.ok(await Lista.findByPk(l.id));
  const empty = (await listas.crearLista(a.id, { nombre: 'Borrado primero' })).data;
  const [del, late] = await Promise.all([
    listas.eliminarLista(a.id, empty.id),
    tareas.crearTarea(a.id, { titulo: 'Demasiado tarde', listaId: empty.id }),
  ]);
  assert.equal(del.status, 200);
  assert.equal(late.status, 404);
});

test('Datos históricos de etiquetas se leen seguros y la normalización es idempotente', async () => {
  const { tarea } = await fixture();
  await db.sequelize.query('UPDATE TAREAS SET ETIQUETAS = :raw WHERE ID_TAREA = :id', {
    replacements: { raw: '"texto"', id: tarea.id },
  });
  assert.deepEqual((await Tarea.findByPk(tarea.id)).etiquetas, []);
  assert.deepEqual(await normalizarEtiquetasGuardadas(), {
    revisadas: 1,
    modificadas: 1,
    aplicado: false,
  });
  assert.equal((await Tarea.findByPk(tarea.id)).getDataValue('etiquetas'), '"texto"');
  assert.equal((await normalizarEtiquetasGuardadas({ aplicar: true })).modificadas, 1);
  assert.equal((await normalizarEtiquetasGuardadas({ aplicar: true })).modificadas, 0);
});

test('Ni modelos ni servicios guardan etiquetas no textuales', async () => {
  const { a, lista, tarea } = await fixture();
  await assert.rejects(
    tareas.actualizarTarea(a.id, tarea.id, { etiquetas: [{}] }),
    (e) => e.status === 400
  );
  await assert.rejects(Tarea.create({ titulo: 'Inválida', listaId: lista.id, etiquetas: 'texto' }));
  assert.equal(await Tarea.count(), 1);
});
