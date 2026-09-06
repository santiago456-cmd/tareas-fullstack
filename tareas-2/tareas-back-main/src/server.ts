import { pathToFileURL } from 'node:url';
import { iniciarServidor } from './lifecycle.js';

export async function main() {
  // Carga y validación explícitas antes de abrir conexiones o escuchar HTTP.
  const { env, validarEntorno } = await import('./config/env.js');
  validarEntorno();
  const { createApp } = await import('./app.js');
  const { prepararConexionSqlite, sequelize } = await import('./config/database.js');
  const { verificarMigraciones } = await import('./migrations/runner.js');
  const runtime = await iniciarServidor({
    app: createApp(),
    port: env.port,
    initialize: async () => {
      await prepararConexionSqlite();
      await verificarMigraciones(sequelize);
    },
    closeDatabase: () => sequelize.close(),
  });
  console.log(`${env.appName} escuchando en http://localhost:${env.port}`);
  const stop = () => {
    runtime
      .stop()
      .then(() => {
        process.off('SIGTERM', stop);
        process.off('SIGINT', stop);
      })
      .catch((error) => {
        console.error('Error al cerrar la aplicación:', error);
        // El plazo incluye las conexiones HTTP y la base; no dejar el proceso colgado.
        process.exit(1);
      });
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  return runtime;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('Error al iniciar la aplicación:', error);
    process.exitCode = 1;
  });
}
