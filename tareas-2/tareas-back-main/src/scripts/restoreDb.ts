import { restaurarRespaldo } from '../services/restoreService.js';
try {
  console.log(
    `Base restaurada y validada: ${await restaurarRespaldo(process.argv[2], process.argv[3])}`
  );
} catch (error) {
  console.error('Error al restaurar:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
