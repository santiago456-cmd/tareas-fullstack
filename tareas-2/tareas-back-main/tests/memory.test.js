import { test, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.SQLITE_STORAGE = ':memory:';
const { sequelize, prepararConexionSqlite } = await import('../src/config/database.js');
await import('../src/models/associations.js');
const { CuentasService } = await import('../src/services/CuentasService.js');
after(() => sequelize.close());

test('La conexión en memoria admite altas concurrentes sin anidar transacciones', async () => {
  await prepararConexionSqlite();
  await sequelize.sync({ force: true });
  const service = new CuentasService();
  const cuentas = await Promise.all(
    Array.from({ length: 5 }, () =>
      service.resolverDesdeUsuario({ id: 'memory', username: 'memory' })
    )
  );
  assert.equal(new Set(cuentas.map((c) => c.id)).size, 1);
});
