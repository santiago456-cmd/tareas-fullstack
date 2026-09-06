# api-tareas

API REST para la gestión de listas de tareas.
Permite crear, consultar, actualizar y eliminar **listas**, junto con las **tareas** asociadas a cada una.

---

## Tecnologias

- **Node.js 24**, **TypeScript estricto** y **Express 5**
- **Sequelize** como ORM
- **SQLite** como base de datos
- **dotenv** para variables de entorno
- **cors** para control de origenes permitidos
- **Swagger UI** para documentacion interactiva (`/api/docs`)
- **ESLint** y **Prettier** para calidad de codigo

---

## Estructura

```
api-tareas/
├── src/
│   ├── app.ts                      Factoría de Express y rutas; arranque en server.js
│   ├── config/
│   │   ├── database.ts             Instancia de Sequelize (SQLite)
│   │   └── env.ts                  Carga y exporta las variables de entorno
│   ├── controllers/                Reciben la request HTTP y devuelven la response
│   ├── services/                   Logica de negocio (validaciones, reglas)
│   ├── repositories/
│   │   ├── BaseRepository.js       Clase base con operaciones CRUD reutilizables
│   │   ├── ListasRepository.js     Acceso a datos de listas
│   │   └── TareasRepository.js     Acceso a datos de tareas
│   ├── models/                     Definicion de modelos/tablas: Lista y Tarea
│   ├── middlewares/
│   │   ├── corsMiddleware.js       Configura CORS con el origen permitido
│   │   ├── requestLogger.js        Loguea metodo, ruta y duracion de cada request
│   │   ├── validateIdParam.js      Valida que el parametro :id sea un entero positivo
│   │   └── notFoundMiddleware.js   Responde 404 para rutas inexistentes
│   ├── routes/
│   │   ├── apiRoutes.js            Agrupa y monta todas las rutas bajo /api
│   │   ├── listasRoutes.js         Rutas del recurso Listas
│   │   ├── tareasRoutes.js         Rutas del recurso Tareas
│   │   └── healthCheckRoutes.ts    Ruta de estado del servidor
│   ├── scripts/
│   │   ├── initDb.js               Inicializa la base de datos y ejecuta los seeders
│   │   └── seeders/                Datos iniciales para listas y tareas
│   ├── docs/
│   │   └── swagger.js              Configuracion de OpenAPI/Swagger
│   └── utils/
│       └── apiResponse.js          Formato estandar de respuestas (exito y error)
├── data/
│   └── db.sqlite                   Archivo de base de datos (generado automaticamente)
├── pruebasListas.http              Requests de prueba para el recurso Listas
├── pruebasTareas.http              Requests de prueba para el recurso Tareas
├── .env.example                    Plantilla de variables de entorno
└── package.json
```

---

## Configuracion del entorno

Antes de correr el proyecto, copia `.env.example` como `.env` y completá los valores:

```bash
cp .env.example .env
```

`.env.example`:

```
PORT=          # Puerto en el que corre el servidor (ej: 3000)
NODE_ENV=      # Entorno de ejecucion: development | production
APP_NAME=      # Nombre de la aplicacion (ej: api-tareas)
CORS_ORIGIN=   # Origen permitido por CORS (ej: http://localhost:5173)
```

---

## Scripts

| Script                  | Descripcion                                    |
| ----------------------- | ---------------------------------------------- |
| `npm start`             | Inicia el servidor en modo produccion          |
| `npm run dev`           | Inicia el servidor con hot-reload (`--watch`)  |
| `npm run init-db`       | Crea las tablas y carga datos iniciales        |
| `npm run init-db:force` | Elimina y recrea las tablas, luego carga datos |
| `npm run lint`          | Analiza el codigo con ESLint                   |
| `npm run lint:fix`      | Corrige errores de lint automaticamente        |
| `npm run format`        | Formatea el codigo con Prettier                |

### Base de datos (primera vez)

Si es la primera vez que levantás el proyecto, ejecutá el script de inicializacion antes de arrancar el servidor:

```bash
npm run build
npm run init-db
```

Este script crea el archivo `data/db.sqlite`, genera las tablas a partir de los modelos y carga datos de ejemplo (5 listas y 6 tareas).

Si necesitas resetear la base de datos a su estado inicial:

```bash
npm run init-db:force
```

---

## Endpoints

La documentacion interactiva completa esta disponible en:

```
GET /api/docs
```

### Health Check

| Metodo | Ruta                | Descripcion                            |
| ------ | ------------------- | -------------------------------------- |
| GET    | `/api/health-check` | Estado del servidor y la base de datos |

### Listas

| Metodo | Ruta                              | Descripcion                                |
| ------ | --------------------------------- | ------------------------------------------ |
| GET    | `/api/listas`                     | Obtener todas las listas                   |
| GET    | `/api/listas?incluirVacias=false` | Obtener solo listas con tareas             |
| GET    | `/api/listas/:id`                 | Obtener una lista por ID                   |
| GET    | `/api/listas/:id/tareas`          | Obtener una lista con sus tareas           |
| POST   | `/api/listas`                     | Crear una nueva lista                      |
| PATCH  | `/api/listas/:id`                 | Actualizar parcialmente una lista          |
| DELETE | `/api/listas/:id`                 | Eliminar una lista (sin tareas pendientes) |

#### Campos de una Lista

| Campo         | Tipo   | Requerido | Descripcion                          |
| ------------- | ------ | --------- | ------------------------------------ |
| `nombre`      | string | Si        | Unico, entre 3 y 100 caracteres      |
| `descripcion` | string | No        | Texto libre, hasta 250 caracteres    |
| `color`       | string | No        | Nombre o codigo de color (hasta 30c) |

### Tareas

| Metodo | Ruta                           | Descripcion                                 |
| ------ | ------------------------------ | ------------------------------------------- |
| GET    | `/api/tareas`                  | Obtener todas las tareas                    |
| GET    | `/api/tareas?completada=false` | Filtrar por estado (true / false)           |
| GET    | `/api/tareas?prioridad=alta`   | Filtrar por prioridad (baja / media / alta) |
| GET    | `/api/tareas/:id`              | Obtener una tarea por ID                    |
| POST   | `/api/tareas`                  | Crear una nueva tarea                       |
| PATCH  | `/api/tareas/:id`              | Actualizar parcialmente una tarea           |
| PATCH  | `/api/tareas/:id/completar`    | Marcar una tarea como completada            |
| DELETE | `/api/tareas/:id`              | Eliminar una tarea                          |

#### Campos de una Tarea

| Campo              | Tipo    | Requerido | Descripcion                          |
| ------------------ | ------- | --------- | ------------------------------------ |
| `titulo`           | string  | Si        | Entre 3 y 150 caracteres             |
| `listaId`          | integer | Si        | ID de la lista a la que pertenece    |
| `descripcion`      | string  | No        | Texto libre, hasta 500 caracteres    |
| `prioridad`        | string  | No        | `baja`, `media` (default) o `alta`   |
| `fechaVencimiento` | date    | No        | Formato `YYYY-MM-DD`                 |
| `etiquetas`        | array   | No        | Lista de strings, guardada como JSON |

---

## Pruebas con REST Client

Los archivos `.http` contienen requests listas para ejecutar desde VSCode con la extension [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client).

- `pruebasListas.http` — requests para el recurso Listas
- `pruebasTareas.http` — requests para el recurso Tareas

Para usarlas:

1. Instalar la extension **REST Client** en VSCode.
2. Abrir el archivo `.http` correspondiente.
3. Hacer clic en `Send Request` sobre cualquier request.

---
# Instructivo ejecucion primera vez paso a paso.

| Script                  | Descripcion                                    |
| ----------------------- | ---------------------------------------------- |
| `pnpm run keycloak:up`             | Levantar Keycloak          |
| `pnpm run keycloak:setup`           | Ejecutar setup de realm/cliente/usuarios  |
| `pnpm run init-db:force`       | Inicializa DB        |
| `pnpm run dev` |Levanta la API |


## Validación y pruebas (iteración 01)

Entorno verificado: Node.js 24 y pnpm 11.13.0. `pnpm install --frozen-lockfile`, `pnpm test` y `pnpm run lint`. Los tests usan bases temporales y un servidor JWKS local; no requieren Keycloak ni modifican la base de desarrollo. `src/app.ts` exporta la factoría para tests; `pnpm start` ejecuta `dist/server.js`.

Las escrituras rechazan campos desconocidos, tipos incorrectos y PATCH vacío con 400. `nombre` admite 3–100 caracteres, `titulo` 3–150 (ambos recortan espacios); las descripciones admiten null o texto de hasta 250 caracteres en listas y 500 en tareas. `color` admite null o texto de 1–30 caracteres. `listaId` debe ser un número entero positivo seguro al crear una tarea; no se modifica mediante PATCH. La finalización usa su endpoint específico.

`fechaVencimiento` admite null o una fecha real YYYY-MM-DD. `etiquetas` debe ser un arreglo de hasta 20 textos de 1–50 caracteres; se recortan espacios y eliminan duplicados. Omitirlas al crear produce []; null es inválido. Los filtros booleanos aceptan exclusivamente true/false y no se permiten filtros repetidos o desconocidos. Las prioridades admitidas son baja, media y alta.

Los errores conservan el sobre JSON de la API, usan códigos estables y no exponen mensajes internos del ORM/proveedor. Los conflictos de unicidad devuelven 409. `X-Request-Id` permite correlacionar respuesta y logs, incluso ante JSON inválido o un cuerpo superior a 100 KB.

## Respaldo y datos históricos en SQLite

El arranque activa WAL y synchronous=FULL para la base persistente. No copiar únicamente el archivo principal mientras la API está activa: puede haber datos confirmados en el WAL. Crear un snapshot consistente mediante:

```bash
pnpm run backup-db /ruta/respaldo-nuevo.sqlite
pnpm run normalizar-etiquetas
pnpm run normalizar-etiquetas --apply --backup /ruta/antes-de-normalizar.sqlite
```

El segundo comando solo informa cuántos registros necesitan normalización. El tercero exige un respaldo antes de modificar datos. La normalización conserva textos válidos, descarta elementos inválidos y limita el arreglo a 20 etiquetas; las lecturas ya son tolerantes aunque no se ejecute el script. No se ha aplicado este mantenimiento a la base del usuario.

Para restaurar, detener la API, conservar la base original y configurar `SQLITE_STORAGE` con la ruta de una copia del snapshot. Verificar esa copia con `sqlite3 /ruta/copia.sqlite 'PRAGMA integrity_check;'` (debe devolver `ok`) y reiniciar la API apuntando a ella. Usar una ruta nueva evita mezclar archivos WAL/SHM de otra base. La suite comprueba restauración, contenido e integridad sobre archivos temporales; no simula cortes eléctricos.

El alta de cuenta y sus listas de bienvenida, y el borrado de una lista con sus tareas completadas, son transaccionales. Las cuentas existentes sin listas no se repueblan automáticamente, porque pueden haberlas eliminado intencionalmente.


## Autenticación (iteración 02)

La API exige firma, issuer, expiración, subject y `KEYCLOAK_AUDIENCE` (por defecto `tareas-api`). Una audiencia que solo contiene `account` ya no permite acceso. Se retiraron `/login`, `/auth/callback` y el servicio OAuth del backend: iniciar sesión exclusivamente desde el frontend. Los endpoints retirados devuelven 404 JSON.

En el cliente público existente de Keycloak, configurar Standard Flow, PKCE S256, deshabilitar Implicit Flow y Direct Access Grants. Agregar un mapper de tipo **Audience**, nombre `tareas-api-audience`, Included Custom Audience `tareas-api`, Add to access token activado y Add to ID token desactivado. Si se personaliza `KEYCLOAK_AUDIENCE`, el mapper debe emitir exactamente ese valor. La SPA conserva su client ID y callback `http://localhost:5173/auth/callback`.

El script `scripts/setup-keycloak.sh` incluye este mapper y lo actualiza por nombre al repetirse. El cierre operativo de la iteración configuró y verificó estos valores en el realm local existente mediante cambios puntuales, sin ejecutar el setup completo. Desde la iteración 03, el setup conserva las contraseñas de usuarios existentes y solo exige KEYCLOAK_DEMO_PASSWORD si necesita crear usuarios demo nuevos. Después de cambiar el mapper, volver a ingresar para obtener tokens nuevos.


## Operación local y verificaciones (iteración 03)

Keycloak está limitado a `127.0.0.1:8081`. Compose es exclusivamente de desarrollo (`start-dev`); no constituye una configuración de producción. Antes de crear un volumen nuevo, elegir `KEYCLOAK_ADMIN_PASSWORD` en `.env` (archivo ignorado por Git). En un volumen existente, mantener la credencial administrativa actual: cambiar la variable de bootstrap no rota la contraseña persistida.

`pnpm run keycloak:up` aplica la configuración. `pnpm run keycloak:setup` autentica kcadm con las variables del contenedor, conserva contraseñas existentes y actualiza cliente, mapper y roles. Para crear usuarios demo por primera vez, exportar `KEYCLOAK_DEMO_PASSWORD` en la terminal antes del setup. No se incluyen contraseñas demo predeterminadas en el script. Los comandos requieren acceso a Docker; ya no fuerzan sudo ni descartan las variables del usuario.

`GET /api/health-check` es público y devuelve 200 si la base responde; ante fallo devuelve 503, `success: false`, código `SERVICIO_NO_DISPONIBLE` y comprobaciones en `error.details`. No expone el mensaje de SQLite y usa `Cache-Control: no-store`. Sirve como comprobación de disponibilidad de la API y su base.

`pnpm run init-db` termina con código 0 al completar o repetir una inicialización correcta, y código 1 si falla la inicialización o el cierre. No fuerza la salida antes de cerrar la conexión.

`pnpm run test:production` copia fuentes y manifiestos a un directorio temporal, instala con `--prod --frozen-lockfile`, inicializa una base temporal y comprueba HTTP de health-check y Swagger. No toca `.env`, `node_modules` ni la base habitual del proyecto. Requiere acceso al registro de paquetes y permiso para abrir un puerto local. CI ejecuta esta comprobación además de tests y lint.


## Backend TypeScript estricto (iteración 05)

Todo `src/` está migrado a TypeScript. `tsconfig.json` activa `strict`, `noUncheckedIndexedAccess` y `noEmitOnError`, con módulos ESM/NodeNext y salida ES2022 en `dist/`. Las importaciones relativas mantienen extensión `.js` para que el artefacto compilado se ejecute en Node sin loaders. Las declaraciones de modelos usan `declare` para no sobrescribir los accessors de Sequelize.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm run init-db
pnpm start
```

`pnpm dev` observa y ejecuta `src/server.ts` con tsx. `pnpm run dev:types` permite observar también los errores del compilador en otra terminal; tsx transpila para ejecutar, no sustituye el typecheck. La CI exige typecheck, lint y tests.

`pnpm test` compila antes de ejecutar las regresiones JavaScript sobre `dist/`. Las pruebas de tipos en `tests/types/contracts.ts` se verifican mediante `typecheck` y no se ejecutan: comprueban que TypeScript rechaza entradas incompletas, etiquetas no textuales y contextos de autenticación sin comprobar. No se usan any explícitos ni supresiones globales del compilador en las fuentes.

Los cuerpos HTTP son unknown hasta validarlos. Los DTO de escritura, resultados discriminados éxito/error y sobre de respuesta están definidos en `src/types/contracts.ts`. El contexto de identidad/cuenta es opcional en Express y debe comprobarse antes de acceder. La representación interna TEXT de etiquetas conserva una conversión de tipos localizada en el setter Sequelize; su contrato público sigue siendo string[] y tiene validación en runtime.

Para producción: compilar con dependencias de desarrollo durante la construcción, distribuir `dist/` con manifiestos/lockfile e instalar `pnpm install --prod --frozen-lockfile` en el entorno de ejecución. `pnpm start`, `init-db`, `backup-db` y `normalizar-etiquetas` ejecutan archivos compilados y no requieren TypeScript ni tsx. Swagger resuelve controladores junto al módulo ejecutado, tanto en src como en dist. `test:production` comprueba este flujo en un directorio temporal.

El E2E compila el backend antes de levantar su entorno aislado. SQLite, el esquema persistente y el formato JSON de la API se conservan. No se migró el frontend ni se implementó todavía PostgreSQL/BFF.
