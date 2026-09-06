# Iteración 05 — Backend TypeScript estricto

Migración de todos los módulos src: configuración, modelos, repositorios, servicios, controladores, middleware, rutas y scripts. SQLite y el contrato HTTP se mantienen.

- strict + noUncheckedIndexedAccess + noEmitOnError; NodeNext/ES2022.
- Modelos Sequelize con atributos/creación tipados y declare, repositorio genérico, DTO de entrada y resultados discriminados.
- Cuerpos HTTP unknown hasta validación; identidad/cuenta opcionales con guardas reales. Errores externos unknown con estrechamiento antes de acceder a propiedades.
- Desarrollo con tsx; producción en dist sin dependencias TypeScript. Scripts de mantenimiento ejecutan dist. Swagger resuelve documentación desde el módulo ejecutado.
- Tests de regresión ejecutan dist y se agregaron aserciones de compilación negativas. CI ejecuta typecheck explícito; runner E2E compila antes de iniciar API.

Validación local: tipos y lint aprobados; 85 pruebas backend aprobadas, incluida documentación OpenAPI compilada; instalación --prod, init-db, health-check y Swagger verificados sin devDependencies; resolución ESM/Swagger desde TypeScript comprobada. E2E y CI se registran al finalizar.

La prueba negativa de tipos usa @ts-expect-error deliberadamente: falla si una restricción desaparece. No hay any explícitos ni @ts-ignore/ts-nocheck en src. Existe una conversión localizada para el TEXT interno del getter/setter de etiquetas de Sequelize; los tests de datos históricos y validación siguen cubriéndola.

No se ejecutaron inicializaciones sobre la base del usuario. El seeder ahora detecta listas demo faltantes y produce un error explícito en lugar de intentar acceder a null.

E2E local: ambos escenarios con Keycloak real aprobaron (1,4 minutos), incluyendo renovación y revocación de sesión; el entorno temporal se limpió.
