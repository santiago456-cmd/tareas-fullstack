# Iteración 06 — Colecciones y operación del backend

Alcance: BE-09, BE-10, BE-12 y BE-14 sobre el backend TypeScript, manteniendo SQLite.

- **BE-09:** listado de listas con dos sentencias SQL, conteos indexados y filtro de listas vacías previo a la paginación. Prueba con 81 listas que verifica cantidad constante de sentencias.
- **BE-10:** páginas acotadas en listas, tareas y tareas de una lista, validación estricta de page/limit, orden con desempate por ID, totales filtrados por cuenta e índices compuestos instalados mediante migración. El frontend recorre las páginas para conservar su comportamiento; todavía acumula la colección completa en memoria.
- **BE-12:** baseline compatible con el esquema anterior, migraciones inmutables con checksum y transacción IMMEDIATE, adopción sin pérdida de datos, rechazo de esquemas parciales y restauración a archivo nuevo con validación de integridad/referencias y publicación exclusiva. No se implementa todavía PostgreSQL.
- **BE-14:** arranque explícito, validación previa, comprobación de versiones antes de escuchar, liberación ante error de arranque, drenaje HTTP y cierre idempotente con plazo de 10 segundos para SIGTERM/SIGINT.

Validación local: 97 pruebas backend y 21 frontend aprobadas; TypeScript estricto, lint de ambos proyectos, build frontend y smoke de producción sin devDependencies aprobados. Las pruebas incluyen procesos reales, señales, puerto ocupado, solicitudes en curso, cierre forzado, adopción de una base creada por Sequelize, rollback de migraciones, restauración e aislamiento HTTP entre cuentas. Los dos E2E con Keycloak real aprobaron en 1,4 minutos (login/CRUD/SSO/logout y renovación/revocación); el contenedor y la red temporal fueron eliminados. Tras reforzar el rechazo de destinos con WAL/SHM, se repitieron tipos, lint, build y pruebas de migración/operación.

No se modificó la base de datos de desarrollo. Para activar esta versión sobre una base existente: detener escritores, crear respaldo, ejecutar `pnpm run migrate-db` y reiniciar. Procedimiento completo en el README del backend. La rama de trabajo es `codex/backend-reliability`; integración y CI remota pendientes.

## Cierre de CI

GitHub Actions aprobó el commit `d8c7024ef268cfbdd6548554f9a38eabdfaec5c6` en `codex/backend-reliability`: [ejecución 34049428500](https://github.com/santiago456-cmd/tareas-fullstack/actions/runs/34049428500). Backend, frontend y E2E terminaron correctamente. Evidencia: `resultado-ci-iteracion06.json`. Las menciones anteriores a CI pendiente son históricas; siguen pendientes la integración a la rama principal y la aplicación de migraciones a la base de desarrollo.
