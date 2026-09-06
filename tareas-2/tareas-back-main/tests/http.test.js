import { test, beforeEach, afterEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { testDatabase } from './helpers/database.js';

const db = await testDatabase();
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'test', alg: 'RS256' };
const listen = (server) =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
const keys = http.createServer((_req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ keys: [jwk] }));
});
const keyPort = await listen(keys);
process.env.KEYCLOAK_BASE_URL = `http://127.0.0.1:${keyPort}`;
process.env.KEYCLOAK_REALM = 'test';
process.env.KEYCLOAK_CLIENT_ID = 'tareas-test';
const issuer = `${process.env.KEYCLOAK_BASE_URL}/realms/test`;
const { createApp } = await import('../dist/app.js');
const { ListasRepository } = await import('../dist/repositories/listasRepository.js');
const { Lista } = await import('../dist/models/lista.js');
const { Tarea } = await import('../dist/models/tarea.js');
const { Cuenta } = await import('../dist/models/Cuenta.js');
const { ForeignKeyConstraintError, ValidationError, UniqueConstraintError } =
  await import('sequelize');
const api = http.createServer(createApp());
const port = await listen(api);
async function token(
  sub = 'alice',
  roles = ['usuario'],
  expiration = '5m',
  signingKey = privateKey,
  audience = 'tareas-api'
) {
  return new SignJWT({ preferred_username: sub, realm_access: { roles } })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(issuer)
    .setSubject(sub)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(signingKey);
}
const alice = await token();
const bob = await token('bob');
beforeEach(async () => {
  await db.reset();
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
});
afterEach(() => mock.restoreAll());
after(async () => {
  await new Promise((r) => api.close(r));
  await new Promise((r) => keys.close(r));
  await db.close();
});

async function request(path, { method = 'GET', body, raw, bearer = alice, headers = {} } = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.ok(response.headers.get('x-request-id'));
  return { status: response.status, headers: response.headers, body: await response.json() };
}
function error(result, status, code) {
  assert.equal(result.status, status);
  assert.equal(result.body.success, false);
  assert.equal(result.body.data, null);
  assert.equal(result.body.meta, null);
  assert.equal(result.body.error.code, code);
  assert.equal(typeof result.body.message, 'string');
  assert.deepEqual(
    Object.keys(result.body).sort(),
    ['success', 'message', 'data', 'meta', 'error'].sort()
  );
}
async function createList() {
  const response = await request('/api/listas', { method: 'POST', body: { nombre: 'Lista HTTP' } });
  assert.equal(response.status, 201);
  return response.body.data;
}

test('CRUD completo conserva contrato, ownership, etiquetas, filtros y regla de pendientes', async () => {
  const lista = await createList();
  const created = await request('/api/tareas', {
    method: 'POST',
    body: { titulo: 'Tarea HTTP', listaId: lista.id, etiquetas: [' api ', 'api'] },
  });
  assert.equal(created.status, 201);
  const tarea = created.body.data;
  assert.deepEqual(tarea.etiquetas, ['api']);
  const edited = await request(`/api/tareas/${tarea.id}`, {
    method: 'PATCH',
    body: { descripcion: 'Nueva', fechaVencimiento: '2028-02-29' },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.descripcion, 'Nueva');
  assert.equal((await request('/api/tareas?completada=false&prioridad=media')).body.data.length, 1);
  assert.equal((await request(`/api/listas/${lista.id}/tareas`)).body.data.tareas.length, 1);
  error(
    await request(`/api/listas/${lista.id}`, { method: 'DELETE' }),
    409,
    'LISTA_CON_TAREAS_PENDIENTES'
  );
  assert.equal(
    (await request(`/api/tareas/${tarea.id}/completar`, { method: 'PATCH' })).status,
    200
  );
  error(
    await request(`/api/tareas/${tarea.id}/completar`, { method: 'PATCH' }),
    409,
    'TAREA_YA_COMPLETADA'
  );
  assert.equal((await request(`/api/listas/${lista.id}`, { method: 'DELETE' })).status, 200);
  error(await request(`/api/tareas/${tarea.id}`), 404, 'TAREA_NO_ENCONTRADA');
});

test('Datos inválidos devuelven 400 JSON; no modifican registros', async () => {
  const lista = await createList();
  const invalidBodies = [
    { nombre: 123 },
    { nombre: null },
    { nombre: 'Lista', descripcion: 'x'.repeat(251) },
    { nombre: 'Lista', color: 'x'.repeat(31) },
    { nombre: 'Lista', cuentaId: 999 },
    [],
  ];
  for (const body of invalidBodies)
    error(await request('/api/listas', { method: 'POST', body }), 400, 'DATOS_INVALIDOS');
  for (const change of [
    { titulo: 123 },
    { etiquetas: 'texto' },
    { etiquetas: [{}] },
    { etiquetas: null },
    { fechaVencimiento: '2026-02-30' },
    { listaId: '1' },
    { descripcion: 'x'.repeat(501) },
  ]) {
    error(
      await request('/api/tareas', {
        method: 'POST',
        body: { titulo: 'Tarea válida', listaId: lista.id, ...change },
      }),
      400,
      'DATOS_INVALIDOS'
    );
  }
  error(
    await request(`/api/listas/${lista.id}`, { method: 'PATCH', body: { nombre: null } }),
    400,
    'DATOS_INVALIDOS'
  );
  error(await request(`/api/listas/${lista.id}`, { method: 'PATCH' }), 400, 'DATOS_INVALIDOS');
  error(
    await request(`/api/listas/${lista.id}`, { method: 'PATCH', body: {} }),
    400,
    'DATOS_INVALIDOS'
  );
  assert.equal(await Tarea.count(), 0);
  assert.equal((await Lista.findByPk(lista.id)).nombre, 'Lista HTTP');
});

test('IDs y queries no admiten coerciones, duplicados ni filtros desconocidos', async () => {
  for (const id of ['0', '-1', '1.5', '1e2', '0x10', '9007199254740992', 'abc']) {
    error(await request(`/api/listas/${id}`), 400, 'ID_PARAM_INVALIDO');
  }
  for (const path of [
    '/api/listas?incluirVacias=yes',
    '/api/listas?incluirVacias=true&incluirVacias=false',
    '/api/tareas?prioridad=urgente',
    '/api/tareas?completada=0',
    '/api/tareas?desconocido=x',
  ]) {
    error(await request(path), 400, 'DATOS_INVALIDOS');
  }
});

test('400 y 413 del parser incluyen CORS y request ID sin filtrar trazas', async () => {
  const headers = { Origin: 'http://localhost:5173' };
  const malformed = await request('/api/listas', { method: 'POST', raw: '{"nombre":', headers });
  error(malformed, 400, 'JSON_INVALIDO');
  assert.equal(malformed.headers.get('access-control-allow-origin'), headers.Origin);
  error(
    await request('/api/listas', { method: 'POST', body: { nombre: 'x'.repeat(110000) }, headers }),
    413,
    'CUERPO_DEMASIADO_GRANDE'
  );
  assert.equal(console.log.mock.callCount(), 2);
  assert.equal(JSON.stringify(malformed.body).includes('SyntaxError'), false);
});

test('401,403 y404 mantienen el mismo sobre; el rol admin sigue protegido', async () => {
  error(await request('/api/listas', { bearer: null }), 401, 'TOKEN_REQUERIDO');
  error(await request('/api/listas', { bearer: 'invalid' }), 401, 'TOKEN_INVALIDO');
  error(
    await request('/api/listas', { bearer: await token('alice', ['usuario'], 1) }),
    401,
    'TOKEN_INVALIDO'
  );
  const wrong = await generateKeyPair('RS256');
  error(
    await request('/api/listas', {
      bearer: await token('alice', ['usuario'], '5m', wrong.privateKey),
    }),
    401,
    'TOKEN_INVALIDO'
  );
  error(await request('/api/admin/cuentas'), 403, 'NO_AUTORIZADO');
  assert.equal(
    (await request('/api/admin/cuentas', { bearer: await token('admin', ['admin']) })).status,
    200
  );
  error(await request('/api/desconocido'), 404, 'ROUTE_NOT_FOUND');
});

test('HTTP: otro usuario no obtiene ni modifica recursos ajenos', async () => {
  const lista = await createList();
  const tarea = (
    await request('/api/tareas', { method: 'POST', body: { titulo: 'Privada', listaId: lista.id } })
  ).body.data;
  for (const [method, path, body, code] of [
    ['GET', `/api/listas/${lista.id}`, undefined, 'LISTA_NO_ENCONTRADA'],
    ['GET', `/api/listas/${lista.id}/tareas`, undefined, 'LISTA_NO_ENCONTRADA'],
    ['PATCH', `/api/listas/${lista.id}`, { nombre: 'Ajena' }, 'LISTA_NO_ENCONTRADA'],
    ['DELETE', `/api/listas/${lista.id}`, undefined, 'LISTA_NO_ENCONTRADA'],
    ['GET', `/api/tareas/${tarea.id}`, undefined, 'TAREA_NO_ENCONTRADA'],
    ['PATCH', `/api/tareas/${tarea.id}`, { titulo: 'Ajena' }, 'TAREA_NO_ENCONTRADA'],
    ['PATCH', `/api/tareas/${tarea.id}/completar`, undefined, 'TAREA_NO_ENCONTRADA'],
    ['DELETE', `/api/tareas/${tarea.id}`, undefined, 'TAREA_NO_ENCONTRADA'],
    ['POST', '/api/tareas', { titulo: 'Ajena', listaId: lista.id }, 'LISTA_NO_ENCONTRADA'],
  ])
    error(await request(path, { method, body, bearer: bob }), 404, code);
  assert.deepEqual((await request('/api/tareas', { bearer: bob })).body.data, []);
});

test('Primer ingreso paralelo y POST duplicado no producen 500', async () => {
  const first = await Promise.all(Array.from({ length: 6 }, () => request('/api/listas')));
  assert.ok(first.every((r) => r.status === 200 && r.body.data.length === 2));
  assert.equal(await Cuenta.count(), 1);
  assert.equal(await Lista.count(), 2);
  const duplicates = await Promise.all(
    Array.from({ length: 2 }, () =>
      request('/api/listas', { method: 'POST', body: { nombre: 'Lista HTTP' } })
    )
  );
  assert.deepEqual(duplicates.map((r) => r.status).sort(), [201, 409]);
  error(
    duplicates.find((r) => r.status === 409),
    409,
    'LISTA_DUPLICADA'
  );
});

test('500 inesperado no revela SQL/tokens y queda correlacionado en logs', async () => {
  await createList();
  mock.method(ListasRepository.prototype, 'paginaConConteos', async () => {
    throw new Error('SELECT secret_token FROM private_table');
  });
  const result = await request('/api/listas');
  error(result, 500, 'ERROR_INTERNO');
  assert.equal(JSON.stringify(result.body).includes('secret_token'), false);
  const log = JSON.parse(console.error.mock.calls[0].arguments[0]);
  assert.equal(log.requestId, result.headers.get('x-request-id'));
  assert.equal(log.path, '/api/listas');
  assert.equal(JSON.stringify(log).includes('secret_token'), false);
});

test('Errores ORM tienen respuestas de validación/conflicto; no son 500', async () => {
  await createList();
  for (const [cause, status, code] of [
    [new ValidationError('privado'), 400, 'DATOS_INVALIDOS'],
    [new UniqueConstraintError({ message: 'privado' }), 409, 'RECURSO_DUPLICADO'],
    [new ForeignKeyConstraintError({ message: 'privado' }), 409, 'CONFLICTO_REFERENCIA'],
  ]) {
    const spy = mock.method(ListasRepository.prototype, 'paginaConConteos', async () => {
      throw cause;
    });
    error(await request('/api/listas'), status, code);
    spy.mock.restore();
  }
});

test('Callbacks fallidos y logs no exponen códigos, state ni mensajes del proveedor', async () => {
  const result = await request('/auth/callback?code=secreto&state=secreto');
  error(result, 404, 'ROUTE_NOT_FOUND');
  error(
    await request('/auth/callback?error=secreto&error_description=secreto'),
    404,
    'ROUTE_NOT_FOUND'
  );
  error(await request('/api/no-existe?token=secreto'), 404, 'ROUTE_NOT_FOUND');
  assert.equal(JSON.stringify(console.log.mock.calls).includes('secreto'), false);
});

test('La API rechaza audiencia account y acepta su audiencia exclusiva', async () => {
  error(
    await request('/api/listas', {
      bearer: await token('alice', ['usuario'], '5m', privateKey, 'account'),
    }),
    401,
    'TOKEN_INVALIDO'
  );
  error(await request('/login'), 404, 'ROUTE_NOT_FOUND');
});

test('Health-check público: 200 disponible, 503 sin base y recuperación sin caché', async () => {
  const healthy = await request('/api/health-check', { bearer: null });
  assert.equal(healthy.status, 200);
  assert.equal(healthy.body.data.checks.database, 'OK');
  assert.equal(healthy.headers.get('cache-control'), 'no-store');
  const spy = mock.method(db.sequelize, 'authenticate', async () => {
    throw new Error('SQL secreto');
  });
  const unavailable = await request('/api/health-check', { bearer: null });
  error(unavailable, 503, 'SERVICIO_NO_DISPONIBLE');
  assert.equal(unavailable.body.error.details.checks.database, 'ERROR');
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  assert.equal(JSON.stringify(unavailable.body).includes('secreto'), false);
  spy.mock.restore();
  assert.equal((await request('/api/health-check', { bearer: null })).status, 200);
});

test('OpenAPI conserva rutas documentadas desde los controladores compilados', async () => {
  const { swaggerSpec } = await import('../dist/docs/swagger.js');
  assert.ok(swaggerSpec.paths['/api/listas']);
  assert.ok(swaggerSpec.paths['/api/tareas']);
  assert.ok(swaggerSpec.paths['/api/health-check']);
});

test('Colecciones: límite por defecto, páginas estables, filtros y totales aislados', async () => {
  const lista = await createList();
  const cuenta = await Cuenta.findOne({ where: { keycloakSub: 'alice' } });
  await Tarea.bulkCreate(
    Array.from({ length: 105 }, (_, i) => ({
      titulo: `Tarea ${i}`,
      listaId: lista.id,
      completada: i < 4,
      fechaCreacion: new Date('2026-01-01'),
    }))
  );
  const other = await Cuenta.create({ keycloakSub: 'other', username: 'other' });
  const foreignList = await Lista.create({ nombre: 'Ajena', cuentaId: other.id });
  await Tarea.create({ titulo: 'Ajena', listaId: foreignList.id });
  const first = await request('/api/tareas');
  assert.equal(first.body.data.length, 50);
  assert.deepEqual(first.body.meta, {
    page: 1,
    limit: 50,
    total: 105,
    totalPages: 3,
    hasNextPage: true,
  });
  const second = await request('/api/tareas?page=2');
  assert.equal(second.body.data.length, 50);
  assert.ok(first.body.data.at(-1).id < second.body.data[0].id);
  const last = await request(`/api/listas/${lista.id}/tareas?page=3`);
  assert.equal(last.body.data.tareas.length, 5);
  assert.equal(last.body.meta.total, 105);
  assert.equal(last.body.meta.hasNextPage, false);
  const empty = await request('/api/tareas?page=4');
  assert.deepEqual(empty.body.data, []);
  assert.equal(empty.body.meta.total, 105);
  assert.equal((await request('/api/tareas?completada=true&limit=2')).body.meta.total, 4);
  const lists = await request('/api/listas?incluirVacias=false&limit=1');
  assert.equal(lists.body.meta.total, 1);
  assert.equal(lists.body.data[0].cantidadTareas, 105);
  assert.equal((await request(`/api/listas/${foreignList.id}/tareas`)).status, 404);
  assert.ok(cuenta);
});

test('Paginación rechaza límites excesivos, coerciones, negativos y valores repetidos', async () => {
  const lista = await createList();
  for (const path of ['/api/listas', '/api/tareas', `/api/listas/${lista.id}/tareas`]) {
    for (const query of [
      'limit=101',
      'limit=0',
      'page=-1',
      'page=1.5',
      'page=1e2',
      'limit=2&limit=3',
      'page=1000001',
      'page=01',
      'limit=',
    ]) {
      assert.equal((await request(`${path}?${query}`)).status, 400, `${path}?${query}`);
    }
  }
});
