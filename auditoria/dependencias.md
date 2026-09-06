# Dependencias — auditoría del 2026-09-05

Fuente: consultas `pnpm audit --json` al registro npm con los locks existentes. No se actualizaron versiones. Los números de severidad corresponden al scanner, no a explotación demostrada en esta aplicación. Un mismo aviso puede aparecer en ambos proyectos.

## Alcance práctico

- Vite y esbuild afectan al servidor de desarrollo, no al hosting de archivos del build por sí solo. Los avisos específicos de Windows no se demostraron en este host Linux.
- React Router aparece en runtime. Esta SPA usa BrowserRouter, no SSR; el aviso de deserializeErrors/SSR no se ha demostrado alcanzable. Los destinos Link/navigate se construyen principalmente desde rutas internas e IDs; no se demostró el open redirect.
- ESLint y sus transitivas se ejecutan al analizar fuentes, no al atender solicitudes.
- Swagger está declarado devDependency pero se importa en el arranque del backend: su clasificación en el manifest no basta para excluirlo del análisis de runtime. Las entradas OpenAPI observadas son fuentes locales; no se demostró SSRF por una petición remota.
- qs está en la cadena Express/body-parser; esta app usa express.json y no habilita urlencoded/extended explícitamente. Los escenarios exactos del aviso deben contrastarse antes de afirmar explotabilidad.
- uuid aparece vía Sequelize; no se demostró invocación del camino vulnerable con buffer controlado.
- nanoid aparece en PostCSS; no se demostró el uso de generador custom con tamaño cero.

## Avisos completos

### Frontend

Conteo del scanner: `{'info': 0, 'low': 0, 'moderate': 6, 'high': 5, 'critical': 0}`.

| Paquete / versión encontrada | Severidad | Aviso | Versión corregida declarada por el aviso |
|---|---|---|---|
| esbuild 0.21.5 | moderate | [esbuild enables any website to send any requests to the development server and read the response ](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | >=0.24.3 |
| vite 5.4.21 | moderate | [Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling ](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) | >=6.4.2 |
| vite 5.4.21 | moderate | [launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows ](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) | >=6.4.3 |
| vite 5.4.21 | high | [vite: `server.fs.deny` bypass on Windows alternate paths ](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) | >=6.4.3 |
| react-router 6.30.4 | moderate | [React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) ](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) | >=7.18.0 |
| react-router-dom 6.30.4 | moderate | [React Router: Open redirect leading to XSS ](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2) | >=6.30.5 |
| react-router 6.30.4 | moderate | [React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration ](https://github.com/advisories/GHSA-337j-9hxr-rhxg) | >=7.18.0 |
| brace-expansion 1.1.16 | high | [brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash ](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | >=1.1.17 |
| brace-expansion 1.1.16 | high | [brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation ](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | >=1.1.18 |
| js-yaml 4.3.0 | high | [JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported ](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | >=4.3.1 |
| nanoid 3.3.16 | high | [nanoid: custom generators can loop indefinitely when size is zero ](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | >=3.3.18 |

Las cadenas completas de dependencias y condiciones de cada aviso están en el JSON correspondiente.

### Backend

Conteo del scanner: `{'info': 0, 'low': 0, 'moderate': 3, 'high': 7, 'critical': 0}`.

| Paquete / versión encontrada | Severidad | Aviso | Versión corregida declarada por el aviso |
|---|---|---|---|
| uuid 8.3.2 | moderate | [uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided ](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | >=11.1.1 |
| fast-uri 3.1.4 | high | [fast-uri vulnerable to host confusion via backslash authority introducer ](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) | >=3.1.5 |
| brace-expansion 5.0.8 | high | [brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation ](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | >=5.0.9 |
| js-yaml 4.3.0 | high | [JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported ](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | >=4.3.1 |
| qs 6.15.3 | moderate | [qs array-limit bypass via bracket-key comma parsing ](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) | >=6.15.4 |
| qs 6.15.3 | moderate | [qs: Denial of Service via Attacker Controlled isBuffer ](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) | >=6.16.0 |
| fast-uri 3.1.4 | high | [fast-uri vulnerable to host confusion via skipped IDN canonicalization on scheme-relative references ](https://github.com/advisories/GHSA-5jgf-p345-68v8) | >=3.1.6 |
| fast-uri 3.1.4 | high | [fast-uri vulnerable to server-side request forgery via malformed IPv6 normalization ](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | >=3.1.6 |
| fast-uri 3.1.4 | high | [fast-uri vulnerable to server-side request forgery via repeated hostname percent-decoding ](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) | >=3.1.6 |
| fast-uri 3.1.4 | high | [fast-uri vulnerable to host confusion via percent-encoded scheme normalization ](https://github.com/advisories/GHSA-jqff-g426-hqxp) | >=3.1.6 |

Las cadenas completas de dependencias y condiciones de cada aviso están en el JSON correspondiente.

## Tratamiento recomendado

Actualizar en ramas/cambios acotados; ejecutar instalación reproducible, lint, build y regresiones. El rango corregido de un aviso aislado puede no cubrir otros avisos del mismo paquete. No elegir una versión solo porque cumple una fila: revisar el conjunto y compatibilidad de Vite/plugin React/React Router. Si no se corrige un aviso, documentar alcance, motivo y fecha de revisión.
