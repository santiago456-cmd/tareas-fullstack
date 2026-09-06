import { Cuenta } from './Cuenta.js';
import { Lista } from './lista.js';
import { Tarea } from './tarea.js';

Cuenta.hasMany(Lista, { foreignKey: 'cuentaId', as: 'listas' });
Lista.belongsTo(Cuenta, { foreignKey: 'cuentaId', as: 'cuenta' });
Lista.hasMany(Tarea, { foreignKey: 'listaId', as: 'tareas' });
