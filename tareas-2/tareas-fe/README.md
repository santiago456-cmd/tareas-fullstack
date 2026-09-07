# tareas-fe

Cliente React (Vite) que consume la API REST `api-tareas`, siguiendo el patrón de capas:

```
páginas/componentes  →  repositorios  →  instancia única de Axios  →  API
```

Generado a partir del instructivo **"Construcción del Frontend `tareas-fe`"**.

## Requisitos previos

1. Node.js 24 (versión verificada en CI).
2. El backend `api-tareas` corriendo en `http://localhost:3000` (`npm run build && npm run init-db && npm start`).
3. Keycloak configurado y corriendo (`npm run keycloak:up && npm run keycloak:setup` desde `api-tareas/`).

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
```

Revisá `.env` (ya viene con los valores por defecto usados en clase):

```env
VITE_API_URL=http://localhost:3000/api
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=proyecto-tareas
VITE_KEYCLOAK_CLIENT_ID=proyecto-tareas-node-backend
```

## Flujo de autenticación

El adaptador oficial `keycloak-js` inicializa Authorization Code + PKCE S256 antes del router. Una promesa compartida evita inicializaciones duplicadas y el canje desde efectos React. El callback `/auth/callback` solo presenta el resultado; el adaptador valida state/nonce y procesa el código.

Access, refresh e ID token viven exclusivamente en memoria. Se eliminan las claves heredadas de localStorage al arrancar. El adaptador puede guardar estado transitorio PKCE (no tokens) para completar la redirección. Al recargar se usa check-sso para recuperar la sesión del proveedor; puede requerir una redirección completa. Se conservó el ID del cliente público existente para no romper configuraciones locales, pero el recurso API usa una audiencia independiente: `tareas-api`.

Axios espera la inicialización y renueva cuando quedan menos de 30 segundos. Las peticiones concurrentes comparten renovación. Si falla, se limpia la sesión y se solicita ingresar; un 401 del token vigente hace lo mismo, sin reintentar escrituras. Un 403 no cierra la sesión. El vencimiento también intenta renovar sin esperar una petición. Barra y rutas consumen el mismo estado reactivo.

Se deshabilita el iframe de estado de sesión: el cierre remoto se detecta al renovar, no instantáneamente. Salir borra la sesión local y redirige al logout de Keycloak. Tokens en memoria reducen persistencia, pero no convierten una SPA en inmune a XSS; un BFF con cookies HttpOnly sería otra arquitectura.

Referencia: [adaptador oficial de Keycloak](https://www.keycloak.org/securing-apps/javascript-adapter).

## Estructura

```
src/
├── auth/oauth.js                 # PKCE contra Keycloak
├── repositories/                 # axios.config.js, errores.js, listas/tareas.repository.js
├── styles/tokens.css             # variables CSS (colores, tipografía, spacing, radios)
├── layouts/LayoutPrincipal.jsx
├── components/
│   ├── ui/Boton, ui/Badge, ui/MetricCard, ui/Modal      # atómicos
│   ├── Encabezado (TopNavBar) + TokenBar
│   ├── RequiereAuth                                     # pantalla "acceso requerido"
│   ├── ListaCard, NuevaListaForm                        # pantalla Mis listas
│   ├── EncabezadoDetalleLista, TarjetaTarea, ListaTareas
│   ├── PanelResumenMetricas                             # reusado en 2 pantallas
│   ├── BarraFiltros                                     # pantalla Todas las tareas
│   └── SelectorPrioridad, FormularioTarea               # modal Nueva/Editar tarea
├── pages/                        # Listas, ListaDetalle, ListaForm, Tareas, TareaForm, AuthCallback
└── App.jsx                       # rutas + layout + ToastContainer
```

## Sistema de diseño

Cada componente tiene su propio CSS Module (`Componente.module.css`) y consume las variables
definidas en `src/styles/tokens.css`, generadas a partir de `DESIGN.md` ("Productivity Flow"):
paleta Indigo/Emerald/Amber/Coral, tipografía Inter, radios 8px (botones/inputs) y 16px (cards/modales),
sombras difusas de baja opacidad. No hay Bootstrap ni Tailwind: todo el estilo vive en los `.module.css`.

Componentes atómicos reutilizables en `components/ui/`: `Boton` (primary/secondary/ghost),
`Badge` (pills de prioridad/estado), `MetricCard` (una tarjeta de métrica) y `Modal` (overlay + card).

**Nota de consolidación:** el formulario de tarea (nueva y editar) y el de edición de lista se
presentan como modal, siguiendo el mockup de "Nueva tarea". La tarjeta de tarea es un único
componente (`TarjetaTarea`) reutilizado tanto en el detalle de una lista como en la vista global
de tareas (con un badge adicional mostrando a qué lista pertenece).

## Cobertura de endpoints

| Método | Ruta | Repositorio | Pantalla |
|---|---|---|---|
| GET | `/api/listas` | `obtenerListas` | Listas, Tareas (filtro) |
| GET | `/api/listas/:id` | `obtenerListaPorId` | ListaForm (editar) |
| GET | `/api/listas/:id/tareas` | `obtenerListaConTareas` | ListaDetalle |
| POST | `/api/listas` | `crearLista` | Listas |
| PATCH | `/api/listas/:id` | `actualizarLista` | ListaForm (editar) |
| DELETE | `/api/listas/:id` | `eliminarLista` | Listas |
| GET | `/api/tareas` | `obtenerTareas` | Tareas |
| GET | `/api/tareas/:id` | `obtenerTareaPorId` | TareaForm (editar) |
| POST | `/api/tareas` | `crearTarea` | TareaForm (alta) |
| PATCH | `/api/tareas/:id` | `actualizarTarea` | TareaForm (editar) |
| PATCH | `/api/tareas/:id/completar` | `completarTarea` | ListaDetalle, Tareas |
| DELETE | `/api/tareas/:id` | `eliminarTarea` | ListaDetalle, Tareas |

## Notas

- **Regla de oro:** un componente o página nunca llama a `axios` directamente; siempre pasa por un repositorio.
- Para modificar recursos siempre se usa `PATCH`, nunca `PUT`.
- Para completar una tarea existe un endpoint específico: `PATCH /api/tareas/:id/completar`.
- Los filtros de `/tareas` viven en la URL (`useSearchParams`) para poder compartirse y reabrirse.


## Pruebas automatizadas

Con pnpm 11.13.0: `pnpm install --frozen-lockfile`, `pnpm test` y `pnpm run build`.
Vitest y Testing Library cubren etiquetas históricas inválidas, límites y edición de etiquetas, carga/guardado del formulario y recuperación visual ante errores de renderizado. `pnpm run test:watch` permite iterar localmente. Son pruebas de componentes con jsdom; el login completo contra Keycloak real todavía requiere una suite E2E.


## Lint

`pnpm run lint` ejecuta la configuración plana de ESLint sobre JavaScript, JSX y tests, con reglas recomendadas de JavaScript y hooks de React. Reconoce las referencias a componentes JSX y los globals del navegador; las configuraciones usan globals Node. Ignora `dist`, dependencias y fixtures históricos de auditoría. La CI ejecuta lint en ambos proyectos, además de tests y build frontend.


## E2E

`pnpm run test:e2e` ejecuta Playwright con Keycloak real, frontend y API aislados. Preparación, puertos y limpieza: [guía E2E](../../e2e/README.md).

## TypeScript estricto y correcciones de interfaz

Todo `src/` usa TypeScript/TSX. `tsconfig.json` activa `strict` y `noUncheckedIndexedAccess`, con resolución Bundler y JSX automático. Los DTO HTTP usan fechas serializadas como strings, prioridad cerrada y etiquetas tipadas; los errores externos se estrechan desde `unknown`. Vite sigue transpiliendo durante desarrollo: ejecutar `pnpm run typecheck` o `pnpm exec tsc --watch` para ver los errores de tipos.

- `pnpm run typecheck`: comprueba código y casos negativos de contratos en `tests/types`.
- `pnpm run build`: comprueba tipos antes de generar `dist/`.
- `pnpm test`: pruebas de React/Vitest, incluyendo carreras entre cargas, errores y dobles envíos.
- `pnpm run lint`: ESLint para JS, TS y TSX.
- `pnpm run test:e2e`: Keycloak/API/Chromium aislados, incluyendo un recorrido móvil y de teclado.

GitHub Actions comprueba tipos en ambos proyectos. Los tests y archivos de herramientas que siguen en JavaScript consumen los módulos TypeScript mediante Vite/Vitest; la aplicación no conserva módulos JavaScript en `src/`.

Los diálogos usan `<dialog>` nativo: fondo inerte, foco confinado, Escape, título accesible y desplazamiento interno. Guardar/Cancelar se mantienen fuera del área desplazable. Descartar cambios pide confirmación; durante un guardado no se permite cerrar. La navegación de Listas/Tareas permanece disponible en móvil. Se usan radios nativos y errores asociados a sus campos.

Las cargas distinguen error, espera y colección vacía, ofrecen reintento y descartan respuestas de rutas anteriores. Las mutaciones bloquean envíos concurrentes por formulario o tarjeta. Una edición de tarea abierta directamente vuelve a su lista y usa `/tareas` como alternativa segura. Esto no reemplaza la idempotencia del servidor ante reintentos externos o cortes de red.

Las descripciones se muestran en tarjetas y detalle. Los colores históricos en español (gris, azul, violeta, verde, naranja, rojo, amarillo, blanco, negro) se traducen a hexadecimal; colores CSS válidos se conservan, valores históricos sin representación usan el color predeterminado. Editar permite vaciar el color o introducir un valor CSS válido sin convertirlo silenciosamente a negro. Las listas de `seed-demo` pertenecen al usuario sintético del seeder; no son las listas de bienvenida creadas para un usuario real de Keycloak.

La paginación del API se conserva: las vistas actuales recorren sus páginas para calcular filtros y métricas locales. La navegación visual por páginas sigue pendiente de una iteración de producto.

Para repetir solo el recorrido móvil: `pnpm run test:e2e --grep 'frontend móvil'`. El runner reenvía los argumentos a Playwright y conserva el aislamiento y la limpieza del entorno.
