# Iteración 04 — OPS-02: E2E y CI

Se incorporó Playwright con dos escenarios sobre Keycloak real: login PKCE/canje único/CRUD/recarga/logout y renovación al vencer/revocación/remoción de pantallas protegidas. Ambos pasaron localmente (1,4 minutos), sin mocks de autenticación ni reintentos.

El runner `e2e/run.mjs` crea un proyecto Docker único, realm/usuarios ficticios y SQLite temporal; usa puertos de loopback distintos a desarrollo y limpia contenedor, red, procesos y base al terminar. Se comprobó esa limpieza al finalizar la ejecución exitosa. No se modificaron usuarios ni datos del entorno habitual.

CI mantiene tests y lint de ambos proyectos, build frontend y prueba de instalación de producción backend; agrega un job E2E con Chromium y reporte HTML retenido siete días. No se guardan trazas de red con tokens. Las credenciales del fixture pertenecen exclusivamente al realm efímero de tests.

Comando: `pnpm run test:e2e` desde el frontend. Requisitos, puertos y comportamiento de limpieza: [guía E2E](../e2e/README.md).

Estado remoto: repositorio indicado https://github.com/santiago456-cmd/tareas-fullstack.git, inicialmente vacío. Se prepara la rama codex/ops-02-e2e; la ejecución remota todavía debe verificarse. No se configuraron reglas de protección de ramas.

Publicación: el push fue rechazado por falta de autenticación Git local (`could not read Username`). El remoto está configurado y la rama está comprometida; falta autenticar Git, publicar y verificar el resultado real de Actions. Verificación final local: 84 pruebas backend, 18 frontend, 2 E2E, lint en ambos proyectos y build frontend aprobados.

## Cierre: GitHub Actions verificado

La ejecución [34000806558](https://github.com/santiago456-cmd/tareas-fullstack/actions/runs/34000806558) terminó en **success** sobre el commit `3e3b11e249978e91b59814f4d5f030444274d390` de `codex/ops-02-e2e`. Pasaron los tres jobs: backend (tests, lint e instalación de producción), frontend (tests, lint y build) y E2E con Keycloak real. El reporte Playwright fue publicado como artefacto.

OPS-02 queda completado. Las menciones anteriores a autenticación o publicación pendiente son históricas. Las reglas de protección de ramas no se modificaron. Evidencia de la API de GitHub: `resultado-ci-ops02.json`.
