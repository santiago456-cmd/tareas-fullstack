> Seguimiento de OPS-02: [Iteración 04](ITERACION-04.md).

> Seguimiento de SEC-02, BE-08, BE-11, BE-13 y OPS-01: [Iteración 03](ITERACION-03.md).

> Seguimiento de SEC-01, SEC-03, SEC-04 y FE-01 a FE-03: [Iteración 02](ITERACION-02.md).

> Auditoría inicial: las evidencias y referencias de líneas describen el estado anterior a las correcciones. Para el estado actual de BE-01 a BE-07 y OPS-02, consultar [Iteración 01](ITERACION-01.md). Los probes y sus resultados se conservan como evidencia histórica; las regresiones actuales están en las suites de tests.

# Auditoría de tareas — 5 de septiembre de 2026

**Diagnóstico:** base funcional y comprensible para una aplicación pequeña, con separación de capas y aislamiento de cuentas comprobado. Hay fallos de integridad, sesión, contrato y usabilidad que conviene resolver antes de considerarla lista para un despliegue real.

Se registran **38 hallazgos: 10 P1, 24 P2 y 4 P3**. No se identificó un P0 en el alcance revisado. La prioridad es de trabajo; no equivale a severidad CVSS ni indica que todos los escenarios se hayan explotado. Los riesgos condicionados y las pruebas con fallos simulados se identifican individualmente.

## Alcance y límites

Revisión del proyecto entregado en [tareas-2](/home/santiago/Documents/ChatGPT/tareas/tareas-2): backend Express/Sequelize/SQLite/Keycloak y frontend React/Vite. Se leyeron fuentes, modelos, asociaciones, rutas, controladores, servicios, repositorios, middleware, componentes, páginas, estilos, configuración, scripts, OpenAPI, README y locks. Inventario: 39 archivos JS del backend/configuración, 56 JS/JSX/CSS del frontend/configuración; aproximadamente 5.142 líneas entre ambos conjuntos. Dependencias instaladas no se auditaron línea por línea.

Se hicieron comprobaciones estáticas, compilación, lint, consultas de avisos de dependencias, pruebas con SQLite en memoria, solicitudes HTTP a la fábrica real de Express con JWKS sintético y revisión de componentes reales en navegador. No se corrigió código funcional, no se actualizaron versiones y no se ejecutó init-db:force sobre los datos del proyecto. Se agregaron artefactos de auditoría y fixtures separados; las herramientas regeneraron metadatos/cachés de desarrollo.

**Límites concretos:**

- Keycloak local en localhost:8081 no respondió (conexión rechazada). No se completó un login/logout real ni se inspeccionó la configuración efectiva de un realm en ejecución. La verificación JWT usó claves y usuarios sintéticos.
- El navegador verificó la página real sin sesión y componentes reales con repositorios simulados. Esto verifica render, teclado y estados elegidos, pero no constituye un E2E completo con API y Keycloak reales.
- No se evaluaron infraestructura desplegada, firewall, TLS, backups existentes fuera del repositorio, carga sostenida, todos los navegadores, lector de pantalla real ni una certificación WCAG.
- La instalación mínima de producción se revisó por sus imports/declaraciones; no se realizó una instalación limpia que omitiera devDependencies.
- El directorio entregado aparecía sin seguimiento en Git. No hay un commit del contenido sobre el que anclar esta auditoría; [el inventario SHA-256](/home/santiago/Documents/ChatGPT/tareas/auditoria/inventario-sha256.json) fija los archivos examinados, excluyendo secretos locales, datos, node_modules y fixtures.

## Arquitectura y superficie revisada

```text
React Router → páginas/componentes → repositorios frontend → Axios + Bearer
  └─ OAuth SPA: Authorization Code + PKCE → Keycloak
Express → JWT/JWKS → resolver cuenta → controlador → servicio → repositorio
  └─ Sequelize → CUENTAS 1:N LISTAS 1:N TAREAS → SQLite
```

El frontend contiene un layout persistente, siete páginas, un guard de sesión y componentes reutilizados de tarjetas, filtros, métricas, formularios y modal. Las operaciones CRUD pasan por repositorios; la autenticación realiza su propio fetch. El backend filtra listas por cuentaId y tareas mediante JOIN con su lista propietaria. Admin aplica JWT y rol admin; consulta cuentas/listas globalmente por diseño.

| Superficie | Protección/operación | Evaluación |
|---|---|---|
| GET/POST /api/listas; GET/PATCH/DELETE /api/listas/:id | JWT + cuenta; ids validados | Lectura, cambios, unicidad y borrado revisados; aislamiento probado |
| GET /api/listas/:id/tareas | JWT + cuenta | Contenido de lista y filtro de propietario revisados |
| GET/POST /api/tareas; GET/PATCH/DELETE /api/tareas/:id | JWT + cuenta | Validación, ownership y persistencia probados en servicios/controladores |
| PATCH /api/tareas/:id/completar | JWT + cuenta | 200 inicial y 409 repetido comprobados |
| GET /api/admin/cuentas, /api/admin/listas | JWT + rol admin | Guard 403/200 probado por HTTP en cuentas; consultas revisadas |
| GET /api/me | JWT + cuenta | Revisado; formato diferente del sobre CRUD |
| GET /api/health-check | Público | Conectividad; respuesta incorrecta ante DB caída reproducida |
| GET /api/docs | Público | OpenAPI incompleto y dependencias de runtime mal clasificadas |
| GET /, /login, /auth/callback del backend | Demo OAuth | Flujo duplicado/inconsistente con SPA; revisión estática |
| /listas, /listas/:id, /listas/:id/editar | Guard frontend | Carga, errores, edición y acciones revisadas |
| /tareas, /tareas/:id/editar, /listas/:listaId/tareas/nueva | Guard frontend | Filtros, formulario, modal y render revisados |
| /auth/callback del frontend | Callback público | PKCE/state presentes; reentrada y estado de sesión problemáticos |

No se considera defecto que el usuario admin no pueda modificar recursos ajenos mediante rutas CRUD normales: las rutas administrativas expuestas son de lectura. Tampoco se considera defecto, sin un requisito adicional, que completar sea irreversible en la UI o que no exista búsqueda/traslado de tareas.

## Comprobaciones y resultados

| Comprobación | Resultado |
|---|---|
| Backend: pnpm run lint | PASS, exit 0 |
| Frontend: pnpm run lint | FAIL, exit 2: falta eslint.config.* |
| Frontend: pnpm run build --outDir /tmp/tareas-audit-build | PASS: 144 módulos; JS 340,03 kB / gzip 113,06 kB; CSS 38,27 kB / gzip 6,94 kB |
| Probes de servicios/modelos/controladores | Ejecutados; observaron fallos y controles correctos, detallados abajo |
| HTTP con createApp real y JWKS sintético | Ejecutado: 401/403 esperados, audiencia incorrecta aceptada, errores de parseo HTML |
| Aislamiento entre dos cuentas | Lecturas ajenas null, mutaciones ajenas 404, colección vacía y alta en lista ajena 404 |
| Lista con pendientes / completar dos veces | 409 / [200,409] |
| Alta concurrente de cuenta/lista | Error de unicidad no tratado reproducido |
| Fallo entre borrado de tareas y lista | Pérdida parcial reproducida por inyección de fallo |
| Dependencias | FE 11 avisos; BE 10; sin avisos críticos según scanner |
| Navegador | Navegación móvil ausente; modal recortado; acción enfocada invisible; input perdido; crash de etiquetas; iconos sobredimensionados |
| initDb con ruta inválida /tmp | Informa SQLITE_CANTOPEN pero termina con exit 0 |

Un exit 0 del script de auditoría significa que terminó la recolección de evidencia, **no** que la aplicación pasó todos los escenarios. Los scripts imprimen también los fallos esperados.

**Controles favorables:** firma/emisor/expiración JWT rechazados correctamente en los escenarios negativos; rol admin protegido; aislamiento entre cuentas; índice único por cuenta/nombre; FK de tareas NO ACTION que protege referencias; restricciones de nombre/título/prioridad; PKCE S256 y state en SPA; límite de cuerpo JSON existente; textos normales renderizados mediante React; .env y node_modules ignorados; compilación frontend exitosa.

## Índice de hallazgos

P1: corregir antes del uso real o dentro de la primera estabilización. P2: corregir en iteraciones cercanas. P3: mantenimiento/coherencia de menor urgencia.

| ID | Prioridad | Área | Hallazgo |
|---|---|---|---|
| [SEC-01](#sec-01) | P1 | Autenticación | La API valida la audiencia genérica account |
| [SEC-02](#sec-02) | P1 | Configuración | Keycloak de desarrollo se publica con credenciales conocidas |
| [SEC-03](#sec-03) | P2 | Autenticación | Conviven dos flujos OAuth incompatibles y uno devuelve tokens en JSON |
| [SEC-04](#sec-04) | P2 | Sesión | Access, refresh e ID token se guardan en localStorage |
| [BE-01](#be-01) | P1 | Persistencia | SQLite usa journal_mode=MEMORY incluso con archivo persistente |
| [BE-02](#be-02) | P1 | Contrato API/UI | Etiquetas inválidas se guardan y pueden romper toda la vista |
| [BE-03](#be-03) | P2 | Validación | Tipos y límites de entrada no se validan integralmente |
| [BE-04](#be-04) | P1 | Concurrencia | El alta automática de cuenta no es atómica ni tolera concurrencia |
| [BE-05](#be-05) | P1 | Integridad | Eliminar una lista puede borrar tareas y después fallar |
| [BE-06](#be-06) | P2 | Concurrencia | La unicidad concurrente termina en 500 |
| [BE-07](#be-07) | P2 | Errores/observabilidad | No hay middleware global de errores y se exponen detalles internos |
| [BE-08](#be-08) | P2 | Operación | Health-check indica éxito HTTP aunque falle la base |
| [BE-09](#be-09) | P2 | Rendimiento | GET listas realiza N+1 consultas secuenciales |
| [BE-10](#be-10) | P2 | Escalabilidad | Colecciones sin paginación e índice faltante en tareas |
| [BE-11](#be-11) | P2 | Inicialización | init-db termina con código 0 incluso cuando falla |
| [BE-12](#be-12) | P2 | Evolución de datos | No hay migraciones versionadas ni procedimiento de restauración |
| [BE-13](#be-13) | P1 | Empaquetado | Producción requiere paquetes declarados como devDependencies |
| [BE-14](#be-14) | P3 | Arquitectura/operación | Arranque acoplado a imports y sin cierre controlado |
| [FE-01](#fe-01) | P1 | Sesión | Token vencido mantiene una sesión aparente e inutilizable |
| [FE-02](#fe-02) | P2 | Estado de sesión | La barra superior no se actualiza después del callback |
| [FE-03](#fe-03) | P1 | Login | El callback puede canjear dos veces el mismo código en desarrollo |
| [FE-04](#fe-04) | P1 | Responsive | El modal se recorta en pantallas de poca altura |
| [FE-05](#fe-05) | P2 | Responsive/navegación | En móvil desaparece el acceso a Todas las tareas |
| [FE-06](#fe-06) | P2 | Accesibilidad | El modal no tiene semántica ni manejo de foco |
| [FE-07](#fe-07) | P2 | Accesibilidad | Editar/eliminar listas quedan invisibles al tabular |
| [FE-08](#fe-08) | P2 | Accesibilidad | Nombres de controles, errores y grupo radio incompletos |
| [FE-09](#fe-09) | P2 | Mutaciones | Guardar y otras acciones permiten envíos duplicados |
| [FE-10](#fe-10) | P2 | Errores/recuperación | Fallas de carga se presentan como vacío o pantalla sin formulario |
| [FE-11](#fe-11) | P2 | Concurrencia UI | Respuestas antiguas pueden sobrescribir una ruta nueva |
| [FE-12](#fe-12) | P2 | Navegación | Editar fuerza recarga y cerrar tarea depende del historial |
| [FE-13](#fe-13) | P2 | Formularios | Crear lista borra el texto aunque falle |
| [FE-14](#fe-14) | P3 | CSS | CSS Modules renombra la clase global de iconos |
| [FE-15](#fe-15) | P3 | Producto/contrato | Descripción y color de listas tienen un recorrido incompleto |
| [OPS-01](#ops-01) | P2 | Calidad | El lint de frontend no se puede ejecutar |
| [OPS-02](#ops-02) | P2 | Pruebas | No existe una suite automatizada ni CI del proyecto |
| [OPS-03](#ops-03) | P2 | Documentación | OpenAPI y README no describen el sistema autenticado completo |
| [OPS-04](#ops-04) | P2 | Dependencias | El grafo bloqueado contiene 21 avisos de seguridad |
| [OPS-05](#ops-05) | P3 | Configuración frontend | Puerto de Vite flexible frente a redirect URI exacta |

## Hallazgos granulares

<a id="sec-01"></a>

### SEC-01 · P1 · La API valida la audiencia genérica account

**Evidencia:** HTTP reproducido con JWKS sintético. Un token firmado por el emisor de prueba, con aud=account y azp=otro-cliente, obtiene 200 y provisiona una cuenta. Un token con aud=tareas-api obtiene 401. La firma y el emisor sí se verifican: el problema es aceptar tokens destinados a otro servicio del mismo realm, no una falsificación sin clave.

**Ubicación:** [tareas-back-main/src/middlewares/tokenExtractor.js:22](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/middlewares/tokenExtractor.js:22); [tareas-back-main/scripts/setup-keycloak.sh:111](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/scripts/setup-keycloak.sh:111).

**Corrección propuesta:** Definir una audiencia exclusiva de esta API, emitirla mediante un mapper/scope de Keycloak y validarla. Separar cliente SPA y recurso API; restringir azp únicamente si la política exige clientes concretos.

**Criterio de cierre:** Token dirigido exclusivamente a otro servicio → 401; token con audiencia de tareas → acceso según usuario/roles.

Keycloak recomienda verificar la audiencia del servicio: [documentación oficial](https://www.keycloak.org/docs/latest/server_admin/index.html#_audience).

<a id="sec-02"></a>

### SEC-02 · P1 · Keycloak de desarrollo se publica con credenciales conocidas

**Evidencia:** Código; impacto condicionado a exposición de red. Compose publica 8081 en todas las interfaces, ejecuta start-dev y fija la contraseña administrativa. El setup fija contraseñas de usuarios de prueba y vuelve a cambiarlas incluso si existen. No se comprobó exposición externa ni se ejecutó el setup.

**Ubicación:** [tareas-back-main/docker-compose.yml:5](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/docker-compose.yml:5); [tareas-back-main/scripts/setup-keycloak.sh:141](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/scripts/setup-keycloak.sh:141).

**Corrección propuesta:** Restringir el entorno de práctica a loopback. Separar configuración de producción con TLS, secretos externos y cuentas sin credenciales de demostración. Hacer que el setup no restablezca contraseñas existentes por defecto.

**Criterio de cierre:** Entorno local accesible solo desde loopback; despliegue real sin start-dev ni credenciales demo; segunda ejecución del setup no cambia credenciales.

<a id="sec-03"></a>

### SEC-03 · P2 · Conviven dos flujos OAuth incompatibles y uno devuelve tokens en JSON

**Evidencia:** Código/configuración. El backend usa callback :3000/auth/callback; el setup registra por defecto :5173/auth/callback. La SPA utiliza su propio PKCE. El callback backend devuelve todos los tokens; su state vive en una Map local sin vínculo al navegador, sin límite de entradas y sin persistencia entre procesos. El logger registra code/state en originalUrl. No se demostró un ataque de sesión.

**Ubicación:** [tareas-back-main/.env.example:9](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/.env.example:9); [tareas-back-main/scripts/setup-keycloak.sh:10](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/scripts/setup-keycloak.sh:10); [tareas-back-main/src/routes/authRoutes.js:32](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/routes/authRoutes.js:32); [tareas-back-main/src/services/oauthService.js:39](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/oauthService.js:39); [tareas-back-main/src/middlewares/requestLogger.js:5](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/middlewares/requestLogger.js:5).

**Corrección propuesta:** Elegir y documentar un flujo. Si el backend es solo API, retirar o deshabilitar las rutas demo en producción. Si actúa como BFF, completar sesión, correlación por navegador, caducidad, límites, no-store y redacción de logs.

**Criterio de cierre:** Un único recorrido de login soportado; URI coherente; ningún token/código en respuestas demo o logs de producción; comportamiento definido con múltiples instancias.

<a id="sec-04"></a>

### SEC-04 · P2 · Access, refresh e ID token se guardan en localStorage

**Evidencia:** Código; riesgo condicionado a ejecución de scripts en el origen. Los tres tokens persisten entre sesiones de navegador y quedan disponibles para JavaScript del origen. El refresh token se almacena pero no se usa. No se identificó un vector XSS explotable en el código revisado: los textos normales se renderizan mediante React.

**Ubicación:** [tareas-fe/src/auth/oauth.js:115](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/auth/oauth.js:115); [tareas-fe/src/auth/oauth.js:126](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/auth/oauth.js:126).

**Corrección propuesta:** Definir estrategia de sesión: tokens en memoria con renovación controlada o BFF con cookies HttpOnly/Secure y protección CSRF. Reducir persistencia y limpiar todo al expirar/cerrar sesión; valorar CSP y dependencias de terceros.

**Criterio de cierre:** La política de persistencia es explícita y probada; no se conserva un refresh token que la aplicación no necesita.

<a id="be-01"></a>

### BE-01 · P1 · SQLite usa journal_mode=MEMORY incluso con archivo persistente

**Evidencia:** Código y documentación de SQLite. prepararConexionSqlite fuerza journaling en memoria. Un fallo del proceso durante una escritura puede corromper una base persistente; no se provocó una caída ni se corrompió una base para demostrarlo.

**Ubicación:** [tareas-back-main/src/config/database.js:18](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/config/database.js:18).

**Corrección propuesta:** Usar un modo persistente apropiado —por ejemplo WAL después de validar el entorno— y definir sincronización, backup y restauración. Conservar :memory: para pruebas aisladas.

**Criterio de cierre:** La base persistente no usa MEMORY; respaldo y restauración verificados en entorno descartable.

SQLite documenta este riesgo: [How To Corrupt An SQLite Database File](https://www.sqlite.org/howtocorrupt.html).

<a id="be-02"></a>

### BE-02 · P1 · Etiquetas inválidas se guardan y pueden romper toda la vista

**Evidencia:** Persistencia real en memoria y navegador con fixture. crearTarea acepta etiquetas:"texto" y responde 201; el getter devuelve ese string. TarjetaTarea llama .map y produce TypeError. En navegador la vista queda en blanco. Un array con objetos tampoco cumple el contrato de strings. El alcance observado es la información de la cuenta que contiene la tarea.

**Ubicación:** [tareas-back-main/src/services/TareasService.js:97](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/TareasService.js:97); [tareas-back-main/src/models/tarea.js:68](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/models/tarea.js:68); [tareas-fe/src/components/TarjetaTarea.jsx:74](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/TarjetaTarea.jsx:74); [tareas-fe/src/components/EtiquetasInput/EtiquetasInput.jsx:34](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/EtiquetasInput/EtiquetasInput.jsx:34).

**Corrección propuesta:** Validar array de strings, longitudes y cantidad al crear/editar; normalizar datos existentes. Añadir defensa de render y un Error Boundary como contención.

**Criterio de cierre:** String, objeto y array de objetos → 400; etiquetas válidas funcionan; una respuesta inválida no desmonta toda la aplicación.

<a id="be-03"></a>

### BE-03 · P2 · Tipos y límites de entrada no se validan integralmente

**Evidencia:** Controladores/servicios ejecutados. nombre:123 y titulo:123 generan 500; PATCH nombre:null o sin body también. Descripciones de 251/501 caracteres y color de 31 se guardan con 201, excediendo el contrato declarado. STRING(n) no está imponiendo esos límites en SQLite. fechaVencimiento y listaId tampoco tienen validación explícita completa.

**Ubicación:** [tareas-back-main/src/services/listasService.js:63](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/listasService.js:63); [tareas-back-main/src/services/listasService.js:105](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/listasService.js:105); [tareas-back-main/src/services/TareasService.js:59](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/TareasService.js:59); [tareas-back-main/src/services/TareasService.js:122](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/TareasService.js:122); [tareas-back-main/src/models/lista.js:30](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/models/lista.js:30); [tareas-back-main/src/models/tarea.js:26](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/models/tarea.js:26).

**Corrección propuesta:** Introducir esquemas por operación para body, query e IDs, con tipos, trim, nullability, límites y fecha calendario válida. Rechazar campos desconocidos o documentar su tratamiento; mapear errores de validación del ORM.

**Criterio de cierre:** Entradas inválidas → 400 uniforme; longitudes y fechas límite comprobadas; PATCH vacío/solo desconocidos tiene una política explícita.

<a id="be-04"></a>

### BE-04 · P1 · El alta automática de cuenta no es atómica ni tolera concurrencia

**Evidencia:** Carrera real e inyección de fallo. Dos resolverDesdeUsuario simultáneos para el mismo sub producen un éxito y un SequelizeUniqueConstraintError. Si falla la creación de listas de bienvenida, la cuenta queda creada; el siguiente acceso la devuelve con cero listas y no repara la inicialización. Tareas.jsx y StrictMode pueden generar solicitudes simultáneas en el primer ingreso.

**Ubicación:** [tareas-back-main/src/services/CuentasService.js:15](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/CuentasService.js:15); [tareas-back-main/src/middlewares/resolverCuenta.js:8](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/middlewares/resolverCuenta.js:8); [tareas-fe/src/pages/Tareas.jsx:30](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/Tareas.jsx:30).

**Corrección propuesta:** Resolver cuenta y bienvenida en una transacción; usar unicidad como garantía y tratar/reintentar la carrera según SQLite. Diseñar inicialización idempotente.

**Criterio de cierre:** Primer acceso paralelo sin 500; exactamente una cuenta y dos listas; fallo intermedio revierte todo o permite reparación segura.

<a id="be-05"></a>

### BE-05 · P1 · Eliminar una lista puede borrar tareas y después fallar

**Evidencia:** Fallo inyectado y carrera controlada. Se eliminan tareas completadas y luego la lista en operaciones separadas. Al simular fallo en el segundo paso, la lista permanece y sus tareas completadas ya desaparecieron. Si aparece una tarea pendiente entre el conteo y el borrado, la FK NO ACTION conserva esa tarea y provoca error: no se observó borrado de pendientes por cascada.

**Ubicación:** [tareas-back-main/src/services/listasService.js:150](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/listasService.js:150); [tareas-back-main/src/repositories/tareasRepository.js:59](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/repositories/tareasRepository.js:59); [tareas-back-main/src/repositories/baseRepository.js:26](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/repositories/baseRepository.js:26).

**Corrección propuesta:** Agrupar comprobación y borrados en transacción con estrategia de concurrencia/reintento. Traducir conflictos de integridad a respuesta de negocio.

**Criterio de cierre:** Ante cualquier fallo se conservan lista y tareas; creación concurrente no produce pérdida parcial y devuelve conflicto controlado.

<a id="be-06"></a>

### BE-06 · P2 · La unicidad concurrente termina en 500

**Evidencia:** Carrera real contra SQLite en memoria. Dos creaciones simultáneas de la misma lista pasan la consulta previa; la restricción única permite una y la otra arroja SequelizeUniqueConstraintError. La integridad se conserva, pero los controladores convierten el conflicto en 500.

**Ubicación:** [tareas-back-main/src/services/listasService.js:72](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/listasService.js:72); [tareas-back-main/src/models/lista.js:52](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/models/lista.js:52); [tareas-back-main/src/controllers/listasController.js:251](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/controllers/listasController.js:251).

**Corrección propuesta:** Conservar el índice único y traducir su error a 409. Aplicar igual tratamiento en cambios de nombre y aprovisionamiento.

**Criterio de cierre:** Una creación 201 y otra 409; nunca duplicados ni 500 por un conflicto esperado.

<a id="be-07"></a>

### BE-07 · P2 · No hay middleware global de errores y se exponen detalles internos

**Evidencia:** HTTP reproducido. JSON malformado devuelve 400 HTML y un cuerpo grande 413 HTML; los errores de negocio usan otro sobre y autenticación un tercero. Los catches incluyen error.message del ORM/implementación. express.json se ejecuta antes de CORS y logger, por lo que sus fallos tampoco recorren esos middlewares.

**Ubicación:** [tareas-back-main/src/app.js:16](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/app.js:16); [tareas-back-main/src/controllers/TareasController.js:212](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/controllers/TareasController.js:212); [tareas-back-main/src/middlewares/resolverCuenta.js:11](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/middlewares/resolverCuenta.js:11); [tareas-fe/src/repositories/errores.js:7](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/repositories/errores.js:7).

**Corrección propuesta:** Definir un único formato y un middleware final de errores; redacción de detalles, request ID y registro interno con contexto. Revisar orden de CORS/logger/parser.

**Criterio de cierre:** 400,401,403,404,409,413 y 500 usan JSON consistente; no se exponen trazas/SQL; errores de parseo quedan observables.

<a id="be-08"></a>

### BE-08 · P2 · Health-check indica éxito HTTP aunque falle la base

**Evidencia:** Fallo de DB simulado. Con authenticate fallando, responde HTTP 200, success:true, mensaje de funcionamiento correcto y data.status=DEGRADED. Además authenticate solo prueba conectividad, no que existan tablas o que el esquema sea compatible; configuration se fija en OK.

**Ubicación:** [tareas-back-main/src/controllers/healthCheckController.js:34](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/controllers/healthCheckController.js:34); [tareas-back-main/src/services/healthCheckService.js:8](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/healthCheckService.js:8).

**Corrección propuesta:** Separar liveness de readiness; readiness 503 cuando no se pueden servir solicitudes. Validar esquema/configuración sin exponer información de runtime innecesaria.

**Criterio de cierre:** Monitor HTTP distingue servicio listo de DB caída/esquema faltante; no declara configuración válida sin comprobarla.

<a id="be-09"></a>

### BE-09 · P2 · GET listas realiza N+1 consultas secuenciales

**Evidencia:** Medición SQL. Con 3 listas se ejecutan 4 consultas: una de listas y un COUNT por cada lista, esperado de forma serial. Tareas.jsx también solicita listas, por lo que el coste repercute en ambas pantallas.

**Ubicación:** [tareas-back-main/src/services/listasService.js:14](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/services/listasService.js:14); [tareas-back-main/src/repositories/tareasRepository.js:10](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/repositories/tareasRepository.js:10).

**Corrección propuesta:** Agregar conteos por GROUP BY/JOIN o consulta agrupada y mantener el filtro de cuenta.

**Criterio de cierre:** El número de consultas se mantiene constante al aumentar listas; conteos incluyen listas vacías correctamente.

<a id="be-10"></a>

### BE-10 · P2 · Colecciones sin paginación e índice faltante en tareas

**Evidencia:** Código y PRAGMA index_list. Listas, tareas y endpoints admin devuelven colecciones completas. La tabla TAREAS recién sincronizada no tiene índices; se filtra por lista/estado y se ordena por fecha. El frontend descarga todo, filtra localmente y busca cada nombre de lista linealmente.

**Ubicación:** [tareas-back-main/src/repositories/tareasRepository.js:36](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/repositories/tareasRepository.js:36); [tareas-back-main/src/models/tarea.js:89](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/models/tarea.js:89); [tareas-back-main/src/controllers/adminController.js:8](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/controllers/adminController.js:8); [tareas-fe/src/pages/Tareas.jsx:50](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/Tareas.jsx:50); [tareas-fe/src/repositories/tareas.repository.js:5](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/repositories/tareas.repository.js:5).

**Corrección propuesta:** Definir paginación, filtros y orden en API, límites de tamaño y proyección de atributos. Agregar índices basados en consultas medidas; usar Map por id en frontend.

**Criterio de cierre:** Conjunto grande responde por páginas acotadas; planes de consulta y latencia medidos. No se propone un índice compuesto sin revisar EXPLAIN.

<a id="be-11"></a>

### BE-11 · P2 · init-db termina con código 0 incluso cuando falla

**Evidencia:** Proceso real ejecutado. Al ejecutar initDb con SQLITE_STORAGE=/tmp (directorio, no archivo), aparece SQLITE_CANTOPEN y el proceso termina con exit 0. Scripts/CI pueden continuar creyendo que la base se inicializó.

**Ubicación:** [tareas-back-main/src/scripts/initDb.js:23](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/scripts/initDb.js:23).

**Corrección propuesta:** Asignar exitCode=1 al capturar errores; cerrar la conexión en finally sin sobrescribir el resultado.

**Criterio de cierre:** Inicialización fallida devuelve código distinto de cero; exit 0 únicamente tras completar todas las operaciones.

<a id="be-12"></a>

### BE-12 · P2 · No hay migraciones versionadas ni procedimiento de restauración

**Evidencia:** Inventario/código. Solo se ofrece sequelize.sync y --force. sync sin alter no aplica de forma general cambios a tablas existentes; --force las destruye. No aparecen migraciones, pruebas de actualización ni instrucciones de backup/restore.

**Ubicación:** [tareas-back-main/src/scripts/initDb.js:7](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/scripts/initDb.js:7); [tareas-back-main/package.json:16](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/package.json:16); [tareas-back-main/README.md:120](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/README.md:120).

**Corrección propuesta:** Añadir migraciones versionadas y distinguir datos demo del despliegue. Documentar respaldo, actualización y recuperación; impedir reseteos accidentales en entornos reales.

**Criterio de cierre:** Una versión anterior se actualiza preservando datos; recuperación probada sobre copia descartable.

<a id="be-13"></a>

### BE-13 · P1 · Producción requiere paquetes declarados como devDependencies

**Evidencia:** Dependencias e imports verificados. src/app.js importa swagger-ui-express siempre; docs/swagger.js importa swagger-jsdoc siempre. Ambos están en devDependencies. Una instalación limpia que omita desarrollo no puede resolver esos imports al arrancar.

**Ubicación:** [tareas-back-main/src/app.js:2](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/app.js:2); [tareas-back-main/src/docs/swagger.js:1](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/docs/swagger.js:1); [tareas-back-main/package.json:38](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/package.json:38).

**Corrección propuesta:** Mover paquetes usados en runtime a dependencies o cargar documentación condicionalmente sin imports estáticos de paquetes ausentes.

**Criterio de cierre:** Instalación limpia de producción inicia y responde readiness; la decisión de exponer Swagger es explícita.

<a id="be-14"></a>

### BE-14 · P3 · Arranque acoplado a imports y sin cierre controlado

**Evidencia:** Código. createApp no se exporta y main se ejecuta al importar. No hay gestión de SIGTERM/SIGINT ni cierre de servidor y sequelize; env convierte configuraciones faltantes en defaults y el JWKS puede fallar al construir una URL antes de main.

**Ubicación:** [tareas-back-main/src/app.js:13](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/app.js:13); [tareas-back-main/src/app.js:43](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/app.js:43); [tareas-back-main/src/config/env.js:3](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/config/env.js:3); [tareas-back-main/src/middlewares/tokenExtractor.js:4](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/middlewares/tokenExtractor.js:4).

**Corrección propuesta:** Exportar fábrica de app sin efectos de arranque y separar entrypoint; validar configuración al iniciar y cerrar conexiones al recibir señales.

**Criterio de cierre:** Importar app no abre puertos; configuración inválida produce diagnóstico claro; apagado controlado con solicitudes en curso.

<a id="fe-01"></a>

### FE-01 · P1 · Token vencido mantiene una sesión aparente e inutilizable

**Evidencia:** Módulo ejecutado y código. estaAutenticado solo comprueba que exista access_token: incluso una cadena inválida devuelve true. Axios adjunta el token sin renovar ni tratar globalmente 401. La API sí rechaza tokens vencidos, por lo que el usuario queda dentro de pantallas que fallan hasta reingresar.

**Ubicación:** [tareas-fe/src/auth/oauth.js:142](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/auth/oauth.js:142); [tareas-fe/src/repositories/axios.config.js:15](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/repositories/axios.config.js:15); [tareas-fe/src/components/RequiereAuth.jsx:9](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/RequiereAuth.jsx:9).

**Corrección propuesta:** Implementar estado de sesión central, expiración y renovación sincronizada, o cierre/reingreso explícito al expirar. Preservar la ruta solicitada.

**Criterio de cierre:** Vencimiento con varias solicitudes concurrentes se recupera una sola vez o cierra sesión de forma coherente; sin bucles de 401.

<a id="fe-02"></a>

### FE-02 · P2 · La barra superior no se actualiza después del callback

**Evidencia:** Código; no login real. TokenBar lee almacenamiento al montar y en un efecto vacío. LayoutPrincipal permanece montado durante el callback y la navegación a /listas, de modo que la barra puede seguir mostrando Ingresar después de guardar tokens. Tampoco hay sincronización de logout entre pestañas; sin id_token cerrarSesion no navega.

**Ubicación:** [tareas-fe/src/components/TokenBar.jsx:18](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/TokenBar.jsx:18); [tareas-fe/src/layouts/LayoutPrincipal.jsx:6](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/layouts/LayoutPrincipal.jsx:6); [tareas-fe/src/auth/oauth.js:117](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/auth/oauth.js:117); [tareas-fe/src/auth/oauth.js:133](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/auth/oauth.js:133).

**Corrección propuesta:** Hacer que TokenBar y RequiereAuth consuman el mismo estado reactivo y notificar login, logout y renovación. Tratar eventos entre pestañas si se comparte sesión.

**Criterio de cierre:** Después del callback aparece usuario/Salir sin recargar; logout actualiza inmediatamente todas las vistas relevantes.

<a id="fe-03"></a>

### FE-03 · P1 · El callback puede canjear dos veces el mismo código en desarrollo

**Evidencia:** Código y proveedor de un solo uso simulado. main.jsx activa StrictMode; AuthCallback lanza manejarCallback desde un efecto sin deduplicación. Dos invocaciones concurrentes emitieron dos requests y terminaron en éxito/error. El resultado visible contra Keycloak real depende del orden de respuesta y no se probó porque está detenido.

**Ubicación:** [tareas-fe/src/main.jsx:7](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/main.jsx:7); [tareas-fe/src/pages/AuthCallback.jsx:15](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/AuthCallback.jsx:15); [tareas-fe/src/auth/oauth.js:90](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/auth/oauth.js:90).

**Corrección propuesta:** Deduplicar el intercambio por código/state o usar una implementación OIDC con ciclo de vida controlado. No ocultar el problema desactivando StrictMode.

**Criterio de cierre:** Con StrictMode y reentradas del callback se efectúa un solo intercambio lógico y se evita publicar errores tardíos sobre una sesión válida.

React ejecuta un ciclo extra de efectos en desarrollo: [StrictMode](https://react.dev/reference/react/StrictMode).

<a id="fe-04"></a>

### FE-04 · P1 · El modal se recorta en pantallas de poca altura

**Evidencia:** Navegador con componente real y datos simulados. A 375×667 el botón Guardar ocupa y=633..677: parte queda fuera del viewport y también se recorta el encabezado. Overlay está fixed, centrado, sin overflow de desplazamiento, y la tarjeta no limita altura. El formulario crece con etiquetas/errores y textarea redimensionable.

**Ubicación:** [tareas-fe/src/components/ui/Modal/Modal.module.css:1](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/ui/Modal/Modal.module.css:1); [tareas-fe/src/components/ui/Modal/Modal.module.css:14](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/ui/Modal/Modal.module.css:14); [tareas-fe/src/components/FormularioTarea/FormularioTarea.module.css:55](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/FormularioTarea/FormularioTarea.module.css:55).

**Corrección propuesta:** Limitar altura al viewport dinámico, habilitar scroll interno/overlay y mantener acciones alcanzables. Probar teclado virtual y zoom.

**Criterio de cierre:** Título, campos, errores y acciones accesibles a 320×568, 375×667 y con zoom/teclado; no se pierde contenido fuera del área desplazable.

<a id="fe-05"></a>

### FE-05 · P2 · En móvil desaparece el acceso a Todas las tareas

**Evidencia:** Navegador a 390×844 y código. La navegación Listas/Tareas usa display:none por debajo de 768px y no existe menú alternativo. El logo solo vuelve a listas. El árbol accesible confirma que los dos enlaces desaparecen.

**Ubicación:** [tareas-fe/src/components/Encabezado.module.css:36](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/Encabezado.module.css:36); [tareas-fe/src/components/Encabezado.jsx:19](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/Encabezado.jsx:19).

**Corrección propuesta:** Mantener navegación compacta visible o agregar un menú móvil operable con teclado.

**Criterio de cierre:** Todas las pantallas principales son alcanzables desde la UI a 320–767px.

<a id="fe-06"></a>

### FE-06 · P2 · El modal no tiene semántica ni manejo de foco

**Evidencia:** DOM y código. No existe role=dialog/aria-modal, nombre enlazado, foco inicial, confinamiento del foco ni Escape. El backdrop cierra el formulario inmediatamente; no hay tratamiento de cambios sin guardar.

**Ubicación:** [tareas-fe/src/components/ui/Modal/Modal.jsx:7](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/ui/Modal/Modal.jsx:7).

**Corrección propuesta:** Usar un diálogo accesible con foco inicial/retorno, teclado y fondo inerte. Definir cierre seguro cuando haya edición pendiente.

**Criterio de cierre:** Navegación completa con teclado y lector de pantalla; foco no llega al fondo; cierre/retorno de foco predecibles.

<a id="fe-07"></a>

### FE-07 · P2 · Editar/eliminar listas quedan invisibles al tabular

**Evidencia:** Navegador. Se enfocó el botón edit mediante Tab y su contenedor conservó opacity:0. Solo :hover revela las acciones, sin :focus-within ni alternativa para dispositivos sin hover.

**Ubicación:** [tareas-fe/src/components/ListaCard/ListaCard.module.css:18](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/ListaCard/ListaCard.module.css:18); [tareas-fe/src/components/ListaCard/ListaCard.module.css:44](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/ListaCard/ListaCard.module.css:44).

**Corrección propuesta:** Mostrar acciones con :focus-within y por defecto cuando hover no está disponible; mantener indicadores de foco claros.

**Criterio de cierre:** El usuario puede ver la acción que recibe foco; controles descubribles en pantallas táctiles.

<a id="fe-08"></a>

### FE-08 · P2 · Nombres de controles, errores y grupo radio incompletos

**Evidencia:** Árbol accesible/código. Nueva lista y etiquetas no tienen etiqueta asociada; filtros se anuncian como filter_list/priority_high/check_circle. Botones con iconos se anuncian como edit/delete en lugar de la acción en español. Errores de campos no usan aria-describedby/aria-invalid. El radiogroup de prioridad no implementa navegación de flechas.

**Ubicación:** [tareas-fe/src/components/NuevaListaForm/NuevaListaForm.jsx:20](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/NuevaListaForm/NuevaListaForm.jsx:20); [tareas-fe/src/components/FormularioTarea/FormularioTarea.jsx:79](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/FormularioTarea/FormularioTarea.jsx:79); [tareas-fe/src/components/BarraFiltros/BarraFiltros.jsx:17](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/BarraFiltros/BarraFiltros.jsx:17); [tareas-fe/src/components/SelectorPrioridad/SelectorPrioridad.jsx:15](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/SelectorPrioridad/SelectorPrioridad.jsx:15); [tareas-fe/src/components/TarjetaTarea.jsx:85](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/TarjetaTarea.jsx:85).

**Corrección propuesta:** Etiquetas explícitas, iconos decorativos aria-hidden, nombres contextuales en acciones, asociación de errores y radios nativos o patrón de teclado completo.

**Criterio de cierre:** Árbol accesible en español describe cada control sin depender de iconos/placeholder; errores anunciados; prioridad seleccionable con flechas.

<a id="fe-09"></a>

### FE-09 · P2 · Guardar y otras acciones permiten envíos duplicados

**Evidencia:** Código. Formularios y handlers de completar/eliminar no exponen isSubmitting/pending ni bloquean el control. Dos clicks antes de finalizar el POST pueden crear dos tareas. Se puede cerrar el modal mientras se guarda y recibir navegación/toasts tardíos.

**Ubicación:** [tareas-fe/src/pages/TareaForm.jsx:49](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/TareaForm.jsx:49); [tareas-fe/src/pages/TareaForm.jsx:82](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/TareaForm.jsx:82); [tareas-fe/src/pages/ListaForm.jsx:40](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/ListaForm.jsx:40); [tareas-fe/src/pages/Tareas.jsx:52](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/Tareas.jsx:52).

**Corrección propuesta:** Estado pending por formulario/recurso, controles deshabilitados y manejo coherente de cancelación. Considerar idempotencia en API si el producto debe soportar reintentos de red.

**Criterio de cierre:** Doble click y conexión lenta no duplican altas; feedback visible; finalizar una petición no cambia una pantalla que el usuario ya abandonó.

<a id="fe-10"></a>

### FE-10 · P2 · Fallas de carga se presentan como vacío o pantalla sin formulario

**Evidencia:** Navegador con error simulado y código. ListaForm/TareaForm retornan null mientras no hay datos; si el GET falla, el estado no cambia y solo hay un toast transitorio. Listas/Tareas dejan arrays vacíos ante error inicial, mostrando ausencia de datos. ListaDetalle conserva la lista anterior si cambia id y la nueva petición falla.

**Ubicación:** [tareas-fe/src/pages/ListaForm.jsx:26](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/ListaForm.jsx:26); [tareas-fe/src/pages/ListaForm.jsx:55](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/ListaForm.jsx:55); [tareas-fe/src/pages/TareaForm.jsx:30](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/TareaForm.jsx:30); [tareas-fe/src/pages/Listas.jsx:18](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/Listas.jsx:18); [tareas-fe/src/pages/ListaDetalle.jsx:23](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/ListaDetalle.jsx:23).

**Corrección propuesta:** Modelar loading/error/success por recurso, con error persistente, reintento y navegación de salida. Limpiar estado al cambiar identidad de recurso.

**Criterio de cierre:** 404/500/red caída tienen vistas diferenciadas; no se muestran datos anteriores bajo una URL nueva ni un vacío engañoso.

<a id="fe-11"></a>

### FE-11 · P2 · Respuestas antiguas pueden sobrescribir una ruta nueva

**Evidencia:** Código; escenario deducido. Los efectos de ListaDetalle, ListaForm y TareaForm no cancelan ni descartan resultados al cambiar id. Dos respuestas pueden llegar en orden inverso. FormularioTarea usa defaultValues sin reset al cambiar valoresIniciales, por lo que reutilizar la instancia para otro id puede mantener campos anteriores.

**Ubicación:** [tareas-fe/src/pages/ListaDetalle.jsx:18](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/ListaDetalle.jsx:18); [tareas-fe/src/pages/ListaForm.jsx:26](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/ListaForm.jsx:26); [tareas-fe/src/pages/TareaForm.jsx:30](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/TareaForm.jsx:30); [tareas-fe/src/components/FormularioTarea/FormularioTarea.jsx:25](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/FormularioTarea/FormularioTarea.jsx:25).

**Corrección propuesta:** AbortController o descarte por identidad de solicitud; reset controlado/key cuando cambia el recurso. Extraer hooks de carga compartidos cuando aporte claridad.

**Criterio de cierre:** Navegar A→B con A lento muestra y guarda siempre B; ninguna respuesta vieja sobrescribe B.

<a id="fe-12"></a>

### FE-12 · P2 · Editar fuerza recarga y cerrar tarea depende del historial

**Evidencia:** Código. Listas.editar usa window.location.href, recargando la SPA y dependiendo del fallback del servidor para rutas profundas. TareaForm usa navigate(-1) al cerrar/guardar edición: una apertura directa puede salir del sitio o no regresar a una vista útil. No hay fallback explícito a la lista de origen.

**Ubicación:** [tareas-fe/src/pages/Listas.jsx:40](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/Listas.jsx:40); [tareas-fe/src/pages/TareaForm.jsx:47](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/TareaForm.jsx:47); [tareas-fe/src/pages/TareaForm.jsx:62](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/TareaForm.jsx:62).

**Corrección propuesta:** Usar navegación de React Router y retorno determinado por contexto/listaId, con fallback seguro para entradas directas.

**Criterio de cierre:** Editar desde UI no recarga documento; abrir URL de edición en nueva pestaña y cerrar vuelve a una pantalla válida de tareas.

<a id="fe-13"></a>

### FE-13 · P2 · Crear lista borra el texto aunque falle

**Evidencia:** Navegador con fallo simulado. NuevaListaForm invoca onCrear sin await y limpia nombre inmediatamente. Se comprobó que un fallo deja el input vacío. Solo comprueba no vacío, mientras la API pide 3–100 caracteres.

**Ubicación:** [tareas-fe/src/components/NuevaListaForm/NuevaListaForm.jsx:11](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/NuevaListaForm/NuevaListaForm.jsx:11); [tareas-fe/src/pages/Listas.jsx:30](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/Listas.jsx:30).

**Corrección propuesta:** Esperar resultado exitoso antes de limpiar; propagar éxito/error del handler; validar longitud y mostrar error junto al campo.

**Criterio de cierre:** Ante fallo se conserva el nombre escrito; al crear correctamente se limpia; 1–2 o más de 100 caracteres no se envían.

<a id="fe-14"></a>

### FE-14 · P3 · CSS Modules renombra la clase global de iconos

**Evidencia:** CSS compilado y estilo computado. Selectores como .badge .material-symbols-outlined se convierten en dos clases locales; JSX usa material-symbols-outlined global. La regla de 14px del badge no coincide: se midieron 24px. Ocurre también en filtros, fechas, selector y etiquetas.

**Ubicación:** [tareas-fe/src/components/ui/Badge/Badge.module.css:13](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/ui/Badge/Badge.module.css:13); [tareas-fe/src/components/TarjetaTarea.module.css:88](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/TarjetaTarea.module.css:88); [tareas-fe/src/components/BarraFiltros/BarraFiltros.module.css:31](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/BarraFiltros/BarraFiltros.module.css:31).

**Corrección propuesta:** Marcar la clase global mediante :global(...) o asignar una clase local propia al span.

**Criterio de cierre:** Badge usa 14px y filtros/fechas sus tamaños declarados; selectores del CSS compilado coinciden con el DOM.

<a id="fe-15"></a>

### FE-15 · P3 · Descripción y color de listas tienen un recorrido incompleto

**Evidencia:** Código. Se puede editar descripción, pero ListaCard y el encabezado de detalle no la muestran. La API admite nombres de color; seeds usan gris/azul/violeta y el frontend pasa el valor directamente a CSS/input type=color, que no representan esos nombres en español. Los datos seed además pertenecen a un sub sintético sin login normal.

**Ubicación:** [tareas-fe/src/components/ListaCard/ListaCard.jsx:10](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/ListaCard/ListaCard.jsx:10); [tareas-fe/src/pages/ListaForm.jsx:32](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/pages/ListaForm.jsx:32); [tareas-fe/src/components/EncabezadoDetalleLista/EncabezadoDetalleLista.jsx:9](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/components/EncabezadoDetalleLista/EncabezadoDetalleLista.jsx:9); [tareas-back-main/src/scripts/seeders/listasSeeder.js:12](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/scripts/seeders/listasSeeder.js:12).

**Corrección propuesta:** Mostrar descripción donde aporte contexto y unificar color como hex válido o enum traducido. Separar claramente seed demo y listas de bienvenida de usuarios reales.

**Criterio de cierre:** Una edición tiene efecto visible; todos los colores aceptados se representan y se pueden editar; documentación explica qué datos verá el usuario.

<a id="ops-01"></a>

### OPS-01 · P2 · El lint de frontend no se puede ejecutar

**Evidencia:** Comando real. pnpm run lint termina con exit 2: ESLint 9.39.5 no encuentra eslint.config.*. El manifest declara script y dependencia, pero no configuración ni reglas React/Hooks. Backend lint sí pasa.

**Ubicación:** [tareas-fe/package.json:9](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/package.json:9); [tareas-back-main/eslint.config.js:6](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/eslint.config.js:6).

**Corrección propuesta:** Añadir configuración compatible con JSX, browser, React Hooks y archivos de configuración; definir alcance de fixtures y artefactos.

**Criterio de cierre:** lint frontend y backend corren en instalación limpia y CI; alertan errores de hooks relevantes.

<a id="ops-02"></a>

### OPS-02 · P2 · No existe una suite automatizada ni CI del proyecto

**Evidencia:** Inventario. No hay scripts test, pruebas unitarias/integración/E2E ni workflows. Los archivos .http no son pruebas automatizadas con aserciones. Los probes agregados en esta auditoría son evidencia de diagnóstico, no reemplazan una suite de regresión.

**Ubicación:** [tareas-back-main/package.json:8](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/package.json:8); [tareas-fe/package.json:6](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/package.json:6); [tareas-back-main/pruebasListas.http:1](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/pruebasListas.http:1); [tareas-back-main/pruebasTareas.http:1](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/pruebasTareas.http:1).

**Corrección propuesta:** Empezar por aislamiento, validaciones, concurrencia, expiración/login y CRUD; ejecutar lint/build/tests en CI y conservar los casos de fallos de esta auditoría como regresiones.

**Criterio de cierre:** CI bloquea regresiones de los P1; pruebas sin Keycloak externo más un recorrido E2E con proveedor real controlado.

<a id="ops-03"></a>

### OPS-03 · P2 · OpenAPI y README no describen el sistema autenticado completo

**Evidencia:** Código/documentación. Swagger no declara securitySchemes/security para Bearer y no incluye /me ni endpoints admin; las operaciones no tienen esquemas completos de respuesta. README frontend cita realm/client dds-tareas mientras .env.example/setup usan proyecto-tareas. Los requests .http no incluyen Authorization; DESIGN.md mencionado no está en el árbol entregado.

**Ubicación:** [tareas-back-main/src/docs/swagger.js:4](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/docs/swagger.js:4); [tareas-back-main/src/routes/apiRoutes.js:12](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/routes/apiRoutes.js:12); [tareas-back-main/src/routes/adminRoutes.js:11](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/src/routes/adminRoutes.js:11); [tareas-fe/README.md:27](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/README.md:27); [tareas-back-main/pruebasListas.http:1](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/pruebasListas.http:1).

**Corrección propuesta:** Actualizar contrato OpenAPI, ejemplos autenticados, variables, Node compatible con dependencias y recorrido de primer inicio; generar/verificar documentación en CI.

**Criterio de cierre:** Un colaborador arranca desde las instrucciones y ejecuta requests autenticados sin deducir configuración; Swagger permite Authorize y documenta 401/403.

<a id="ops-04"></a>

### OPS-04 · P2 · El grafo bloqueado contiene 21 avisos de seguridad

**Evidencia:** pnpm audit consultado el 2026-09-05. Frontend: 11 avisos (5 altos, 6 moderados). Backend: 10 (7 altos, 3 moderados). Es conteo del scanner por proyecto; hay avisos compartidos y condiciones de explotación específicas. Predominan Vite/esbuild, lint y Swagger; React Router, qs y uuid también aparecen en dependencias de runtime.

**Ubicación:** [tareas-fe/pnpm-lock.yaml:1](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/pnpm-lock.yaml:1); [tareas-back-main/pnpm-lock.yaml:1](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/pnpm-lock.yaml:1).

**Corrección propuesta:** Actualizar de forma controlada locks/directas/transitivas, revisar avisos uno a uno y volver a ejecutar regresiones. No aplicar upgrades mayores/overrides ciegos. Analizar Swagger como runtime aunque figure en devDependencies.

**Criterio de cierre:** Cada aviso queda corregido o documentado con alcance y justificación verificable; nuevo audit y build/lint/tests registrados.

<a id="ops-05"></a>

### OPS-05 · P3 · Puerto de Vite flexible frente a redirect URI exacta

**Evidencia:** Código/configuración. Vite fija port:5173 pero no strictPort. Si está ocupado puede elegir otro; REDIRECT_URI usa window.location.origin y el setup registra un origen exacto. El login y CORS dejan de coincidir. El build también incorpora URLs localhost cuando falta configuración de despliegue.

**Ubicación:** [tareas-fe/vite.config.js:7](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/vite.config.js:7); [tareas-fe/src/auth/oauth.js:10](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/auth/oauth.js:10); [tareas-fe/src/repositories/axios.config.js:7](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/src/repositories/axios.config.js:7); [tareas-back-main/scripts/setup-keycloak.sh:118](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-back-main/scripts/setup-keycloak.sh:118).

**Corrección propuesta:** Fallar claramente si el puerto esperado está ocupado y validar variables de build por entorno. Documentar fallback SPA y origen permitido del despliegue.

**Criterio de cierre:** Puerto ocupado produce diagnóstico, no un frontend con OAuth roto; build de despliegue no apunta accidentalmente a localhost.

## Iteraciones propuestas

### Actualización de alcance: refactorización prevista

El usuario confirmó después de la auditoría que el destino será **TypeScript en backend y frontend, PostgreSQL en reemplazo de SQLite, Docker para ambos servicios y nuevas funcionalidades**. Esto actualiza la hoja de ruta; los hallazgos anteriores siguen describiendo el estado auditado. Todavía no se definieron las nuevas funcionalidades ni si los datos actuales deben conservarse.

La tabla siguiente conserva la propuesta inicial de estabilización. Para ejecutar la refactorización, prevalece esta secuencia:

1. **Fijar comportamiento y regresiones:** contratos API, aislamiento entre cuentas, permisos, validaciones, concurrencia y recorridos esenciales. Definir las nuevas funcionalidades y la necesidad de migrar datos antes de cerrar el esquema de destino.
2. **Preparar TypeScript y verificación continua:** configuración estricta, typecheck, lint, build y pruebas. Migrar por capas hasta retirar JavaScript del código de aplicación; los tipos no reemplazan la validación de datos externos en runtime.
3. **Migrar persistencia a PostgreSQL:** migraciones versionadas, restricciones, índices y transacciones; revisar tipos de fechas, IDs y etiquetas. Si corresponde conservar datos, preparar y ensayar exportación/importación, verificación y recuperación. Evaluar la continuidad de Sequelize antes de agregar un cambio de ORM al alcance.
4. **Completar Docker para desarrollo y producción:** imágenes de backend y frontend, PostgreSQL y Keycloak coordinados para desarrollo, variables, volúmenes y health checks. Servir el build del frontend en producción y resolver fallback SPA, origen de API y URLs OAuth; no usar el servidor de Vite como servicio de producción. La infraestructura local puede prepararse desde el inicio para acompañar los pasos anteriores.
5. **Cerrar fallos y sumar funcionalidades:** comprobar los criterios de la auditoría sobre la arquitectura nueva y entregar features en incrementos verificables. Separar, cuando sea práctico, cambios de infraestructura y cambios de comportamiento para poder detectar regresiones.

**Ajuste de prioridades:** BE-01 (journal de SQLite) requiere mitigación si la versión actual seguirá almacenando datos importantes; deja de aplicar una vez retirada SQLite. Los índices y planes de BE-10 deben diseñarse y medirse sobre PostgreSQL. BE-12 se incorpora a la migración versionada del nuevo motor. No invertir primero en una optimización extensa de SQLite si se reemplazará inmediatamente. Autenticación, aislamiento, validación, atomicidad, recuperación de errores y accesibilidad siguen siendo requisitos aunque cambien lenguaje, motor o empaquetado. Docker y TypeScript no cierran esos hallazgos por sí solos.

### Propuesta inicial de estabilización (referencia)

| Iteración | Objetivo verificable | Hallazgos |
|---|---|---|
| 1. Integridad y contrato | Validaciones 400 coherentes; etiquetas seguras; alta y borrado atómicos; regresiones que reproduzcan los fallos | BE-01 a BE-07, OPS-02 |
| 2. Autenticación completa | Audiencia propia, un solo flujo, sesión reactiva, expiración/reingreso y callback sin duplicación; E2E con Keycloak real | SEC-01 a SEC-04, FE-01 a FE-03 |
| 3. UI utilizable | Modal móvil, navegación y teclado; errores persistentes, envíos únicos, formularios que no pierden datos | FE-04 a FE-13 |
| 4. Operación y escala | Arranque mínimo, migraciones, readiness, consultas agrupadas/paginadas y CI | BE-08 a BE-14, OPS-01, OPS-04, OPS-05 |
| 5. Coherencia final | Ajustes de estilos/contrato visual y documentación actualizada | FE-14, FE-15, OPS-03 |

**Antes de exponer cualquier entorno:** resolver SEC-02 y BE-13, aunque pertenezcan a bloques posteriores. La exposición real no fue verificada.

Para empezar la primera iteración, el paquete más acotado es **BE-02 + BE-03 + BE-07**, con regresiones: entradas inválidas devuelven 400 JSON y ninguna tarea aceptada por la API rompe su representación. Luego abordar transacciones/concurrencia. No hace falta reescribir la arquitectura ni migrar toda la aplicación para cerrar estos problemas.

## Evidencia y reproducción

- [Hallazgos estructurados](/home/santiago/Documents/ChatGPT/tareas/auditoria/hallazgos.json): IDs estables para registrar avances.
- [Resultados de servicios/modelos](/home/santiago/Documents/ChatGPT/tareas/auditoria/resultados-probes.json).
- [Resultados HTTP con autenticación sintética](/home/santiago/Documents/ChatGPT/tareas/auditoria/resultados-http.json).
- [Detalle de los 21 avisos y alcance](/home/santiago/Documents/ChatGPT/tareas/auditoria/dependencias.md), [JSON frontend](/home/santiago/Documents/ChatGPT/tareas/auditoria/dependencias-fe.json) y [JSON backend](/home/santiago/Documents/ChatGPT/tareas/auditoria/dependencias-be.json).
- [Comprobaciones de navegador y limitaciones](/home/santiago/Documents/ChatGPT/tareas/auditoria/verificacion-ui.md).
- [Script de diagnóstico en memoria](/home/santiago/Documents/ChatGPT/tareas/auditoria/probes.mjs) y [Script HTTP](/home/santiago/Documents/ChatGPT/tareas/auditoria/http-probes.mjs).
- [Fixture de UI](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/auditoria/preview.html) y [Adaptador con datos simulados](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/auditoria/preview.jsx): fuera de src y del entrypoint de producción.

Desde la raíz del proyecto:

```bash
node auditoria/probes.mjs
node auditoria/http-probes.mjs
```

El segundo requiere permiso para abrir puertos efímeros en loopback. Ambos fuerzan SQLite en memoria. El script HTTP carga createApp del archivo original mediante transformación de imports y omisión de main().catch, porque aún no se exporta la fábrica. Mantiene los middleware/rutas reales; no sustituye una prueba de arranque del binario de producción.

Para reproducir UI, iniciar Vite desde tareas-fe y abrir /auditoria/preview.html. Query route selecciona pantalla; error=1 fuerza fallo de carga y badTags=1 simula etiquetas inválidas. Estos fixtures no deben publicarse como parte de un servidor de desarrollo expuesto.

Los resultados y prioridades corresponden al contenido inventariado en esta fecha. Cada iteración debe actualizar el estado del hallazgo y registrar la prueba que cumple su criterio de cierre.
