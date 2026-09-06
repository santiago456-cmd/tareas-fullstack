import resolverCuenta from './resolverCuenta.js';
import tokenExtractor from './tokenExtractor.js';

export const apiAutenticada = [tokenExtractor, resolverCuenta];
