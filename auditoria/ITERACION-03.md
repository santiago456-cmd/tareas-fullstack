# Iteración 03 — Operación, producción y lint

Fecha: 2026-09-05.

| Hallazgo | Corrección | Evidencia |
| --- | --- | --- |
| SEC-02 | Puerto Keycloak limitado a loopback; contraseña administrativa fuera de Compose; setup conserva contraseñas existentes y exige contraseña explícita para usuarios demo nuevos | Contenedor recreado conservando volumen; docker port devuelve 127.0.0.1:8081; setup real repetido sobre usuarios existentes termina 0 sin asignar contraseñas; regresión automatizada de creación y repetición |
| BE-08 | Health-check 503 y success=false ante caída de base, sin caché ni error interno expuesto | HTTP: 200 → fallo simulado de authenticate → 503 → recuperación 200 |
| BE-11 | init-db fija exitCode=1 al fallar y cierra conexión sin process.exit prematuro | Procesos reales sobre SQLite temporal: éxito/repetición 0, archivo corrupto 1 |
| BE-13 | swagger-jsdoc y swagger-ui-express son dependencias de producción | Instalación temporal --prod --frozen-lockfile; inicialización, servidor Express, health-check y Swagger responden correctamente |
| OPS-01 | ESLint plano para JS/JSX, React/hooks y tests; agregado al workflow frontend | Lint backend y frontend sin errores; tests frontend aprobados |

## Resultado

84 pruebas backend y 18 frontend aprobadas. Lint en ambos proyectos aprobado. La prueba de instalación de producción pasó con dependencias de desarrollo omitidas. El workflow ahora ejecuta lint en ambos proyectos y test:production en backend; todavía no se ejecutó remotamente en GitHub.

## Estado operativo y límites

Keycloak queda encendido, con el volumen existente y publicado exclusivamente en 127.0.0.1:8081. La credencial administrativa que ya tenía el volumen se trasladó a `.env`, ignorado por Git; no se rotaron credenciales. No se ejecutó ninguna inicialización sobre la base habitual de tareas. El smoke de producción limpia su directorio temporal al terminar.

Compose continúa siendo de desarrollo y usa start-dev. Un despliegue de producción con TLS, secretos de plataforma y configuración propia se hará en su etapa correspondiente; no se presenta este Compose como listo para producción. El setup conserva usuarios y contraseñas existentes, pero sigue aprovisionando los roles demo definidos por el proyecto.

Las referencias originales de auditoría se conservan como evidencia histórica. Consultar los README actuales para el contrato de health-check y las variables requeridas del entorno local.
