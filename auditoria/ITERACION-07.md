# Iteración 07 — Frontend TypeScript y FE-04 a FE-15

Alcance autorizado: migración a TypeScript estricto y corrección de los doce hallazgos pendientes de frontend. Rama `codex/frontend-typescript-fixes`.

## Migración

Todos los módulos de `src/` migrados a TS/TSX. DTO de listas, tareas, formularios, paginación y sesión; props explícitas, errores externos unknown y estrechamiento de errores Axios. `strict` y `noUncheckedIndexedAccess`, pruebas negativas de contratos, comprobación de tipos antes del build y en ambos jobs de CI. Se conserva Keycloak/PKCE con tokens en memoria; no se incorpora BFF todavía.

## Hallazgos

- FE-04: diálogo acotado al viewport dinámico, cuerpo desplazable y pie accesible.
- FE-05: navegación Listas/Tareas visible en móvil.
- FE-06: diálogo nativo, foco inicial/confinado, Escape, retorno de foco cuando el disparador permanece montado y confirmación de descarte.
- FE-07: acciones visibles al recibir foco y en dispositivos sin hover.
- FE-08: nombres de controles en español, iconos decorativos, errores asociados y radios nativos.
- FE-09: exclusión inmediata de dobles envíos, controles deshabilitados, cierre bloqueado durante guardado y descarte de efectos de mutaciones al abandonar la ruta.
- FE-10: carga/error/vacío diferenciados y reintento explícito.
- FE-11: hook de carga descarta respuestas antiguas, limpia datos de otra ruta y remonta formularios por recurso.
- FE-12: React Router para editar; retorno a lista conocida o `/tareas`, sin depender de navigate(-1).
- FE-13: nombre preservado ante fallo; solo se limpia tras éxito; límites y error contextual.
- FE-14: selectores de iconos globales corregidos mediante `:global`.
- FE-15: descripciones visibles y adaptación de colores heredados; edición conserva null y permite colores CSS válidos. Documentada la separación entre seed-demo y usuarios Keycloak reales.

## Verificación

TypeScript, ESLint, build y 26 pruebas de frontend aprobados. Incluye simulaciones de error/reintento, respuesta A posterior a B, doble envío, retorno directo y mutación resuelta después de desmontar. Los tres recorridos E2E se verificaron con Keycloak real: login/CRUD/SSO/logout, renovación/revocación y móvil/teclado. La prueba de foco detectó y permitió corregir el salto de Tab a la barra del navegador; otra ejecución detectó una carrera del indicador de cambios al pulsar Escape inmediatamente tras cambiar prioridad. Tras corregir esta última, se repitieron tipos, lint, build, 26 pruebas unitarias y el recorrido móvil dirigido, que aprobó en 7,5 segundos. La captura final se revisó visualmente y se adjunta al reporte Playwright. Contenedores y redes temporales eliminados. Las comprobaciones visuales usan Chromium; no se afirma validación manual con lector de pantalla ni teclado virtual de un dispositivo físico.

No se modifican la base operativa ni las migraciones del backend. La publicación, CI remota e integración de esta rama se registrarán por separado.

## Cierre de CI

[GitHub Actions 34073227911](https://github.com/santiago456-cmd/tareas-fullstack/actions/runs/34073227911) aprobó backend, frontend y E2E sobre `ccd1cc3eba01c721c5d5616cb3e3fc0eac5926aa`. Evidencia: `resultado-ci-iteracion07.json`. La rama está publicada; queda pendiente integrar a la rama principal.
