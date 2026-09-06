# Verificación de interfaz — 2026-09-05

Se utilizó el navegador integrado sobre Vite local. Para componentes autenticados se usaron las páginas/componentes originales con repositorios reemplazados exclusivamente en el entrypoint de auditoría. El fixture no llama a la API ni cambia sus datos. Las comprobaciones fueron manuales mediante automatización de navegador, no una suite E2E persistente.

| Escenario | Entorno | Observación |
|---|---|---|
| Página de acceso requerido | App real, sin sesión | Render correcto de encabezado y CTA de ingreso |
| Navegación móvil | App real, 390×844 | Enlaces Listas/Tareas desaparecen del árbol accesible; permanece logo y botón Ingresar |
| Crear tarea | Fixture, 390×844 | Formulario visible; no se observó recorte en este tamaño |
| Crear tarea, menor altura | Fixture, 375×667 | Botón Guardar: top=633, bottom=677; viewport=667. Encabezado y parte de acciones recortados |
| Semántica modal | Fixture | No existe elemento role=dialog |
| Crear lista con error | Fixture /listas, 1280×800 | Se escribió «Conservar nombre», se pulsó Crear, el callback falló y el input quedó vacío |
| Acción de lista con teclado | Fixture /listas | Tab al botón edit: document.activeElement.textContent=edit y opacity del contenedor=0 |
| Etiquetas string | Fixture /tareas?badTags=1 | TypeError: tarea.etiquetas.map is not a function; raíz de UI queda sin contenido |
| GET edición fallido | Fixture /listas/1/editar?error=1 | Tras desaparecer el toast no hay formulario ni error persistente/reintento |
| Nombres accesibles | Fixture /tareas | Filtros anunciados como filter_list, priority_high, check_circle; acciones como edit/delete |
| Tamaños de iconos | Fixture /tareas | filter_list, priority_high, check_circle, signal_cellular_alt y calendar_today a 24px; métricas a 20px |

Las medidas y errores se observaron sobre el DOM/estilos reales. No se guardaron capturas persistentes. El tamaño del navegador se restauró al terminar.

## Reproducción

Desde el directorio frontend, iniciar Vite y abrir estas rutas locales:

- /auditoria/preview.html — nueva tarea.
- /auditoria/preview.html?route=/listas — listas; crear simula error.
- /auditoria/preview.html?route=/tareas — tarea válida.
- /auditoria/preview.html?route=/tareas&badTags=1 — contrato de etiquetas inválido.
- /auditoria/preview.html?route=/listas/1/editar&error=1 — fallo de carga de edición.

La sustitución de repositorios vive en [preview.jsx](/home/santiago/Documents/ChatGPT/tareas/tareas-2/tareas-fe/auditoria/preview.jsx). No se alteraron los componentes originales. La SPA real en /listas se observó sin autenticación porque Keycloak local no estaba disponible.

Queda pendiente un recorrido real de inicio/cierre/renovación de sesión, CRUD persistente, accesibilidad con lector de pantalla y validación cruzada en otros navegadores/dispositivos.
