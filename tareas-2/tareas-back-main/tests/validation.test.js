import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarLista, validarTarea, validarQuery } from '../dist/validation/recursos.js';

const invalid = (fn) =>
  assert.throws(fn, (error) => error.status === 400 && error.code === 'DATOS_INVALIDOS');
for (const body of [
  undefined,
  null,
  [],
  'texto',
  12,
  true,
  {},
  { nombre: 123 },
  { nombre: null },
  { nombre: '  a  ' },
  { nombre: 'x'.repeat(101) },
  { nombre: 'Lista', descripcion: {} },
  { nombre: 'Lista', descripcion: 'x'.repeat(251) },
  { nombre: 'Lista', color: 'x'.repeat(31) },
  { nombre: 'Lista', color: false },
  { nombre: 'Lista', cuentaId: 2 },
]) {
  test(`Lista rechaza ${JSON.stringify(body)}`, () => invalid(() => validarLista(body)));
}
test('Lista conserva límites, normaliza nombre y permite limpiar opcionales', () => {
  assert.deepEqual(validarLista({ nombre: ' Lista ', descripcion: null, color: null }), {
    nombre: 'Lista',
    descripcion: null,
    color: null,
  });
  assert.equal(
    validarLista({ nombre: 'x'.repeat(100), descripcion: 'x'.repeat(250), color: 'x'.repeat(30) })
      .nombre.length,
    100
  );
});
for (const patch of [
  {},
  { desconocido: true },
  { nombre: null },
  { nombre: [] },
  { descripcion: 0 },
]) {
  test(`PATCH lista rechaza ${JSON.stringify(patch)}`, () =>
    invalid(() => validarLista(patch, { parcial: true })));
}
const tarea = { titulo: 'Tarea', listaId: 1 };
for (const change of [
  { titulo: 123 },
  { titulo: null },
  { titulo: '   ' },
  { titulo: 'x'.repeat(151) },
  { listaId: '1' },
  { listaId: 1.5 },
  { listaId: 0 },
  { listaId: Number.MAX_SAFE_INTEGER + 1 },
  { descripcion: 'x'.repeat(501) },
  { prioridad: null },
  { prioridad: 'urgente' },
  { etiquetas: 'texto' },
  { etiquetas: null },
  { etiquetas: {} },
  { etiquetas: [{}] },
  { etiquetas: [5] },
  { etiquetas: ['  '] },
  { etiquetas: ['x'.repeat(51)] },
  { etiquetas: Array(21).fill('tag') },
  { fechaVencimiento: '2025-02-29' },
  { fechaVencimiento: '2026-02-30' },
  { fechaVencimiento: '2026-13-01' },
  { fechaVencimiento: '2026-01-01T00:00:00Z' },
  { fechaVencimiento: 0 },
  { completada: true },
]) {
  test(`Tarea rechaza ${JSON.stringify(change)}`, () =>
    invalid(() => validarTarea({ ...tarea, ...change })));
}
test('Tarea acepta bordes, fecha bisiesta y etiquetas únicas', () => {
  const result = validarTarea({
    titulo: 'x'.repeat(150),
    listaId: 1,
    descripcion: 'x'.repeat(500),
    fechaVencimiento: '2024-02-29',
    etiquetas: [' api ', 'api', 'backend'],
  });
  assert.deepEqual(result.etiquetas, ['api', 'backend']);
  assert.equal(result.fechaVencimiento, '2024-02-29');
  assert.deepEqual(
    validarTarea({ descripcion: null, fechaVencimiento: null, etiquetas: [] }, { parcial: true }),
    { descripcion: null, fechaVencimiento: null, etiquetas: [] }
  );
});
for (const patch of [
  undefined,
  null,
  [],
  {},
  { titulo: null },
  { listaId: 2 },
  { completada: true },
]) {
  test(`PATCH tarea rechaza ${JSON.stringify(patch)}`, () =>
    invalid(() => validarTarea(patch, { parcial: true })));
}
test('Queries rechazan duplicados, booleanos mal escritos y claves desconocidas', () => {
  for (const query of [
    { incluirVacias: ['true', 'false'] },
    { incluirVacias: 'yes' },
    { sorpresa: 'x' },
  ]) {
    invalid(() => validarQuery(query, ['incluirVacias']));
  }
  invalid(() => validarQuery({ prioridad: 'urgente' }, ['prioridad']));
  assert.deepEqual(validarQuery({ completada: 'false' }, ['completada']), { completada: 'false' });
});
