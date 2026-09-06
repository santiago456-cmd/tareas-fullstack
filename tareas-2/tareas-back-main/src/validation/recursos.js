import { HttpError } from '../utils/HttpError.js';

export const PRIORIDADES = ['baja', 'media', 'alta'];
export const MAX_ETIQUETAS = 20;
export const MAX_ETIQUETA = 50;

function invalido(campo, mensaje) {
  throw new HttpError(400, 'DATOS_INVALIDOS', mensaje, { campo });
}

function objeto(datos, permitidos, parcial) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    invalido('body', 'El cuerpo debe ser un objeto JSON');
  }
  if (Object.keys(datos).some((campo) => !permitidos.includes(campo))) {
    invalido('body', 'El cuerpo contiene campos no permitidos');
  }
  if (parcial && Object.keys(datos).length === 0) {
    invalido('body', 'Debe indicar al menos un campo para actualizar');
  }
}

function texto(valor, campo, min, max, nullable = false, trim = false) {
  if (valor === null && nullable) return null;
  if (typeof valor !== 'string') invalido(campo, `${campo} debe ser texto`);
  const limpio = trim ? valor.trim() : valor;
  if (limpio.length < min || limpio.length > max) {
    invalido(campo, `${campo} debe tener entre ${min} y ${max} caracteres`);
  }
  return limpio;
}

export function validarEtiquetas(valor) {
  if (!Array.isArray(valor) || valor.length > MAX_ETIQUETAS) {
    invalido('etiquetas', `etiquetas debe ser un arreglo de hasta ${MAX_ETIQUETAS} textos`);
  }
  return [
    ...new Set(valor.map((etiqueta) => texto(etiqueta, 'etiquetas', 1, MAX_ETIQUETA, false, true))),
  ];
}

// Lectura tolerante de registros anteriores; las escrituras usan validarEtiquetas.
export function normalizarEtiquetas(valor) {
  if (!Array.isArray(valor)) return [];
  return [
    ...new Set(
      valor
        .filter((v) => typeof v === 'string')
        .map((v) => v.trim())
        .filter((v) => v.length > 0 && v.length <= MAX_ETIQUETA)
    ),
  ].slice(0, MAX_ETIQUETAS);
}

function fecha(valor) {
  if (valor === null) return null;
  if (typeof valor !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(valor)) {
    invalido('fechaVencimiento', 'La fecha debe ser YYYY-MM-DD o null');
  }
  const date = new Date(`${valor}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== valor) {
    invalido('fechaVencimiento', 'La fecha de vencimiento no existe en el calendario');
  }
  return valor;
}

export function validarLista(datos, { parcial = false } = {}) {
  objeto(datos, ['nombre', 'descripcion', 'color'], parcial);
  const resultado = {};
  if (!parcial || Object.hasOwn(datos, 'nombre')) {
    resultado.nombre = texto(datos.nombre, 'nombre', 3, 100, false, true);
  }
  if (Object.hasOwn(datos, 'descripcion'))
    resultado.descripcion = texto(datos.descripcion, 'descripcion', 0, 250, true);
  if (Object.hasOwn(datos, 'color'))
    resultado.color = texto(datos.color, 'color', 1, 30, true, true);
  return resultado;
}

export function validarTarea(datos, { parcial = false } = {}) {
  const campos = ['titulo', 'descripcion', 'prioridad', 'fechaVencimiento', 'etiquetas'];
  objeto(datos, parcial ? campos : [...campos, 'listaId'], parcial);
  const resultado = {};
  if (!parcial || Object.hasOwn(datos, 'titulo'))
    resultado.titulo = texto(datos.titulo, 'titulo', 3, 150, false, true);
  if (!parcial) {
    if (!Number.isSafeInteger(datos.listaId) || datos.listaId <= 0)
      invalido('listaId', 'listaId debe ser un entero positivo');
    resultado.listaId = datos.listaId;
  }
  if (Object.hasOwn(datos, 'descripcion'))
    resultado.descripcion = texto(datos.descripcion, 'descripcion', 0, 500, true);
  if (Object.hasOwn(datos, 'prioridad')) {
    if (!PRIORIDADES.includes(datos.prioridad))
      invalido('prioridad', 'La prioridad debe ser baja, media o alta');
    resultado.prioridad = datos.prioridad;
  }
  if (Object.hasOwn(datos, 'fechaVencimiento'))
    resultado.fechaVencimiento = fecha(datos.fechaVencimiento);
  if (Object.hasOwn(datos, 'etiquetas')) resultado.etiquetas = validarEtiquetas(datos.etiquetas);
  return resultado;
}

export function validarQuery(query, permitidos) {
  if (Object.keys(query).some((campo) => !permitidos.includes(campo)))
    invalido('query', 'Filtro no permitido');
  for (const [campo, valor] of Object.entries(query)) {
    if (typeof valor !== 'string') invalido(campo, 'Cada filtro debe tener un único valor');
    if (['completada', 'incluirVacias'].includes(campo) && !['true', 'false'].includes(valor)) {
      invalido(campo, `${campo} debe ser true o false`);
    }
    if (campo === 'prioridad' && !PRIORIDADES.includes(valor))
      invalido(campo, 'La prioridad debe ser baja, media o alta');
  }
  return query;
}
