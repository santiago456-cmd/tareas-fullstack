# Iteración 02 — Autenticación y sesión

Fecha: 2026-09-05.

| Hallazgo | Implementación |
| --- | --- |
| SEC-01 | API exige audiencia tareas-api configurable, firma/issuer/expiración y subject; setup agrega mapper exclusivo al cliente SPA existente |
| SEC-03 | Eliminados login/callback y servicio OAuth backend; único flujo SPA con adaptador oficial keycloak-js 26.2.4 |
| SEC-04 | Tokens solo en memoria; limpieza de claves heredadas; estado transitorio del protocolo gestionado por el adaptador |
| FE-01 | Renovación compartida antes de peticiones y al vencer; fallo o 401 vigente invalida sesión; no se reintentan escrituras |
| FE-02 | Barra y rutas protegidas suscritas al mismo estado reactivo |
| FE-03 | Inicialización única antes de montar el router; callback sin efecto que canjee códigos |

## Validación

81 pruebas backend y 17 frontend aprobadas; lint backend, build frontend y sintaxis bash aprobados. Backend usa JWT firmados y JWKS HTTP local. Las nuevas pruebas frontend simulan el adaptador: inicialización concurrente, limpieza de storage, reacción en StrictMode, renovación concurrente/fallida, cierre durante renovación, 401 antiguo y bloqueo de peticiones sin sesión. No equivalen a un login real ni prueban internamente el protocolo del adaptador.

No había contenedores activos al comprobar Docker. No se ejecutó setup ni se cambió un realm real. Antes de usar esta versión, agregar el mapper indicado en el README backend y volver a ingresar. Tokens antiguos con solo account serán rechazados. La configuración real y el E2E contra Keycloak siguen pendientes.

La elección mantiene la arquitectura SPA/API actual. Recargar recupera sesión mediante check-sso; el cierre remoto se detecta al renovar (iframe deshabilitado). Las claves temporales PKCE pueden usar almacenamiento del navegador; los tokens no se persisten. Un BFF con cookies HttpOnly queda como alternativa futura, no implementada.

Fuente de diseño: [Keycloak JavaScript adapter](https://www.keycloak.org/securing-apps/javascript-adapter).


## Cierre operativo — Keycloak real (2026-09-05)

Pendiente operativo completado sobre el contenedor local `keycloak-proyecto-tareas`, realm `proyecto-tareas`, cliente público `proyecto-tareas-node-backend`.

Configuración leída nuevamente y verificada: Standard Flow activado; Implicit Flow y Direct Access Grants desactivados; PKCE S256; post logout redirect `http://localhost:5173`; mapper `tareas-api-audience` con Included Custom Audience `tareas-api`, access token activado e ID token desactivado. Se conserva la duración normal heredada del realm. El mapper quedó persistido en el volumen existente de Keycloak.

Recorrido manual en navegador con frontend real y API sobre SQLite temporal:

1. Primer acceso sin sesión, redirección a Keycloak e ingreso con usuario demo existente.
2. Retorno a listas, barra con usuario y botón Salir; API acepta el token real.
3. Crear lista y tarea, leerlas y marcar la tarea completada.
4. Recargar y recuperar sesión mediante SSO sin volver a escribir credenciales.
5. Con tokens temporales de 45 segundos, verificar renovación: la actividad de sesión en Keycloak avanzó de 1788632729000 a 1788632774000 y la API siguió sirviendo la lista después del vencimiento inicial.
6. Cerrar remotamente la sesión demo y verificar que la renovación fallida retira la vista protegida y muestra «La sesión terminó. Volvé a ingresar».
7. Reingresar, usar Salir y confirmar que el siguiente ingreso exige credenciales: también se cerró el SSO.

Durante la prueba se corrigió AuthCallback: un check-sso sin sesión y sin error ahora vuelve a la pantalla normal de ingreso, en lugar de presentar un error falso. Se agregó regresión automatizada. Resultado: 18 pruebas frontend aprobadas y build correcto; las 81 pruebas backend de la iteración siguen siendo la evidencia automatizada del backend, que no se modificó en este cierre.

Limpieza: override de 45 segundos eliminado explícitamente y verificado por lectura; sesión demo cerrada; servidores temporales frontend/API detenidos y base temporal eliminada mediante su cierre controlado. Keycloak queda encendido y configurado. No se ejecutó el setup completo ni se cambiaron contraseñas o datos de la base habitual.

Esta verificación es un recorrido E2E manual, no una suite E2E incorporada a CI. La ejecución remota de CI y automatización del recorrido siguen siendo pendientes de OPS-02. Las menciones anteriores a Keycloak no disponible describen el estado previo a este cierre.
