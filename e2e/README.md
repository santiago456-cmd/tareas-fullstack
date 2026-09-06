# E2E con Keycloak real

Desde `tareas-2/tareas-fe`:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm run test:e2e
```

Instalar también las dependencias del backend con `pnpm install --frozen-lockfile` en `tareas-2/tareas-back-main`. Requiere Node 24, pnpm 11.13.0 y Docker Compose.

El runner crea un proyecto Docker único, importa el realm ficticio `tareas-e2e`, inicia API y frontend sobre una base SQLite temporal y ejecuta Chromium. Usa únicamente loopback y los puertos 18081, 13000 y 15173; falla si alguno está ocupado. No reutiliza el Keycloak de desarrollo, su volumen, sus usuarios ni la base habitual. Las contraseñas de realm.json y compose.yml son fixtures públicas exclusivamente para este entorno efímero.

Al finalizar, incluso ante fallos, detiene sus procesos, elimina su proyecto Docker y limpia la base temporal. Ante una interrupción forzada del sistema, puede ser necesario eliminar el proyecto `tareas-e2e-<pid>` que se muestra al arrancar.

Los escenarios verifican:

- Login real con PKCE y un único canje en StrictMode; ausencia de tokens persistidos.
- Crear lista y tarea, completar y eliminar tarea, recuperar sesión al recargar y logout SSO.
- Renovación real al vencer el access token de 40 segundos; revocación administrativa de la sesión ficticia y retirada automática de la vista protegida.

No se simula la red ni se reemplaza el adaptador de Keycloak. La suite usa un worker, sin reintentos, y aserciones con plazos; la renovación se espera por su respuesta HTTP, no mediante una pausa fija. Los tests backend complementan este recorrido con validaciones, aislamiento entre cuentas y concurrencia.

El reporte HTML se guarda en `tareas-2/tareas-fe/playwright-report`; solo se capturan screenshots al fallar. Las trazas de red están deshabilitadas para evitar guardar tokens en artefactos. GitHub Actions publica el reporte durante siete días y ejecuta la misma orden. Referencia: [Playwright en CI](https://playwright.dev/docs/ci).
