import { createApp } from './app.js';
import { prepararConexionSqlite } from './config/database.js';
import { env } from './config/env.js';

async function main() {
  await prepararConexionSqlite();
  createApp().listen(env.port, () => {
    console.log(`${env.appName} escuchando en http://localhost:${env.port}`);
  });
}

main().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exitCode = 1;
});
