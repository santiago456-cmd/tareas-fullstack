// eslint.config.js
// Configuración plana de ESLint.
// Este archivo indica qué reglas de análisis estático queremos aplicar al proyecto.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
export default [
  // Reglas recomendadas de JavaScript propuestas por ESLint.
  js.configs.recommended,
  // Configuración específica para nuestros archivos JavaScript.
  {
    files: ['src/**/*.js', 'tests/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      // Reglas elegidas para este proyecto didáctico.
      // Pueden ajustarse según los criterios de la cátedra.
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  // Desactiva reglas que podrían entrar en conflicto con Prettier.
  prettier,
];
