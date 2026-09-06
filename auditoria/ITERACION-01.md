# Iteración 01 — BE-01 a BE-07 y OPS-02

Fecha: 2026-09-05. Correcciones sobre JavaScript, Sequelize y SQLite actuales. La migración a TypeScript/PostgreSQL y Docker para ambos servicios pertenece a una próxima iteración.

| Hallazgo | Cambio implementado | Verificación local |
| --- | --- | --- |
| BE-01 | WAL + synchronous=FULL al arrancar; backup consistente con VACUUM INTO y procedimiento de restauración | PRAGMA en conexión principal y transaccional; restauración de snapshot, datos e integrity_check |
| BE-02 | Validación de etiquetas al escribir, lectura tolerante de datos históricos, normalizador con respaldo previo, protección de tarjeta/formulario y ErrorBoundary | Datos corruptos no rompen la vista; normalización idempotente y escrituras inválidas rechazadas |
| BE-03 | Contratos explícitos de cuerpos, IDs, filtros, fechas, longitudes y campos permitidos | Casos límite y entradas inválidas por servicio y HTTP; no modifican registros |
| BE-04 | Cuenta y dos listas iniciales en una única transacción, con coordinación de escrituras SQLite | Ocho altas simultáneas, rollback si falla una lista y reintento; también SQLite en memoria |
| BE-05 | Comprobación de pendientes y borrado de tareas completadas/lista en la misma transacción | Fallo intermedio revierte todo; concurrencia de alta/borrado no deja tareas huérfanas |
| BE-06 | Conflictos de unicidad traducidos a 409, incluido el error real del ORM tras una comprobación previa | Altas y cambios de nombre concurrentes; error de restricción inyectado |
| BE-07 | Middleware global de errores JSON, códigos consistentes, redacción de mensajes internos y correlación por request ID | Parser 400/413 con CORS, autenticación/autorización, errores ORM y 500 sin SQL/tokens |
| OPS-02 | Suites backend y frontend, scripts test y workflow para push/PR | 80 pruebas backend + 11 frontend; lint backend y build frontend aprobados localmente |

## Evidencia reproducible

Desde `tareas-2/tareas-back-main`: `pnpm test` y `pnpm run lint`.
Desde `tareas-2/tareas-fe`: `pnpm test` y `pnpm run build`.
Instalación reproducible en ambos: `pnpm install --frozen-lockfile`, Node 24 y pnpm 11.13.0.

La suite backend usa archivos SQLite temporales y HTTP real con JWKS local y tokens firmados. Verifica CRUD, separación entre usuarios, expiración/firma/roles, concurrencia y rollback. La suite frontend usa jsdom y Testing Library para componentes y formulario. El build se verificó en `/tmp/tareas-be-fixes-build`.

## Alcance y pendientes

- BE-01 a BE-07 implementados y verificados localmente. No se simularon cortes eléctricos ni concurrencia entre procesos independientes.
- OPS-02 queda **parcial respecto de su criterio completo de auditoría**: hay suites y CI, pero falta el recorrido E2E contra Keycloak real controlado y ejecutar el workflow remotamente. No se configuraron reglas de protección de ramas. El lint frontend pendiente corresponde a OPS-01; el workflow ejecuta tests en ambos proyectos, lint backend y build frontend.
- No se ejecutó la normalización sobre la base del usuario. Las lecturas tolerantes funcionan sin ella; el procedimiento de mantenimiento con respaldo está en el README del backend.
- Los consumidores deben respetar el contrato más estricto documentado en el README del backend: campos desconocidos, PATCH vacío, tipos incorrectos, filtros repetidos y fechas imposibles ahora devuelven 400.
- No se cambia la política de audiencia de Keycloak (SEC-01), ni se reparan cuentas antiguas sin listas automáticamente: podrían estar vacías por decisión del usuario.
- Los resultados de probes de la auditoría inicial se conservan como evidencia histórica; no representan el estado corregido. Las referencias originales de líneas pueden haber cambiado.

## Archivos de referencia

- Backend: `src/validation/recursos.js`, `src/config/transactions.js`, `src/middlewares/errorHandler.js`, servicios y repositorios de cuentas/listas/tareas, `tests/`.
- Operación: `src/server.js`, `src/services/backupService.js`, scripts de respaldo/normalización y README del backend.
- Frontend: `src/utils/etiquetas.js`, `ErrorBoundary`, tarjeta, editor de etiquetas, formulario y `tests/`.
- Automatización: `.github/workflows/ci.yml` en la raíz del repositorio.
