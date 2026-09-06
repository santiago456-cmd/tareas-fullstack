// Entrada de pruebas: la base temporal y configuración las provee run.mjs.
if (!process.env.TAREAS_E2E || !process.env.SQLITE_STORAGE)
  throw new Error("Usar el runner E2E");
const { prepararConexionSqlite, sequelize } =
  await import("../tareas-2/tareas-back-main/dist/config/database.js");
const { createApp } = await import("../tareas-2/tareas-back-main/dist/app.js");
await prepararConexionSqlite();
await sequelize.sync();
const server = createApp().listen(13000, "127.0.0.1");
async function stop() {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
}
process.once("SIGTERM", () =>
  stop().catch(() => {
    process.exitCode = 1;
  }),
);
process.once("SIGINT", () =>
  stop().catch(() => {
    process.exitCode = 1;
  }),
);
