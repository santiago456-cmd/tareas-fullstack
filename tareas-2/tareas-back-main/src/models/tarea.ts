import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { normalizarEtiquetas, validarEtiquetas } from '../validation/recursos.js';
import { Lista } from './lista.js';

export class Tarea extends Model<InferAttributes<Tarea>, InferCreationAttributes<Tarea>> {
  declare id: CreationOptional<number>;
  declare listaId: number;
  declare titulo: string;
  declare descripcion: string | null;
  declare completada: CreationOptional<boolean>;
  declare prioridad: CreationOptional<'baja' | 'media' | 'alta'>;
  declare fechaVencimiento: string | null;
  declare fechaCreacion: CreationOptional<Date>;
  declare etiquetas: CreationOptional<string[]>;
}

Tarea.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID_TAREA',
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'TITULO',
      validate: {
        len: {
          args: [3, 150],
          msg: 'El título de la tarea debe tener entre 3 y 150 caracteres',
        },
      },
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'DESCRIPCION',
      validate: { len: [0, 500] },
    },
    completada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'COMPLETADA',
    },
    prioridad: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'media',
      field: 'PRIORIDAD',
      validate: {
        isIn: {
          args: [['baja', 'media', 'alta']],
          msg: 'La prioridad debe ser baja, media o alta',
        },
      },
    },
    fechaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'FECHA_VENCIMIENTO',
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'FECHA_CREACION',
    },
    etiquetas: {
      // Para simplificar con SQLite guardamos etiquetas como texto.
      // En este paso no modelamos etiquetas como tabla separada.
      // Podemos almacenar valores separados por coma o JSON serializado.
      // Para este ejemplo usaremos JSON serializado.
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ETIQUETAS',
      get(this: Tarea): string[] {
        const rawValue: unknown = this.getDataValue('etiquetas');
        if (typeof rawValue !== 'string') {
          return [];
        }
        try {
          return normalizarEtiquetas(JSON.parse(rawValue));
        } catch {
          return [];
        }
      },
      set(this: Tarea, value: unknown) {
        this.setDataValue(
          'etiquetas',
          JSON.stringify(validarEtiquetas(value)) as unknown as string[]
        ); // Sequelize almacena TEXT detrás del getter público string[].
      },
    },
    listaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ID_LISTA',
    },
  },
  {
    sequelize,
    modelName: 'Tarea',
    tableName: 'TAREAS',
    indexes: [
      { name: 'IX_tareas_lista_fecha_id', fields: ['ID_LISTA', 'FECHA_CREACION', 'ID_TAREA'] },
      { name: 'IX_tareas_lista_completada', fields: ['ID_LISTA', 'COMPLETADA'] },
    ],
    timestamps: false,
  }
);
// Relación many-to-one:
// Muchas tareas pertenecen a una lista.
Tarea.belongsTo(Lista, {
  foreignKey: {
    name: 'listaId',
    field: 'ID_LISTA',
  },
  as: 'lista',
});
