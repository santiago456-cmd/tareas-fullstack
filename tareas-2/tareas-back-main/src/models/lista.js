import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Lista extends Model {}

Lista.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID_LISTA',
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'NOMBRE',
      validate: {
        len: {
          args: [3, 100],
          msg: 'El nombre de la lista debe tener entre 3 y 100 caracteres',
        },
      },
    },
    cuentaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ID_CUENTA',
    },
    descripcion: {
      type: DataTypes.STRING(250),
      allowNull: true,
      field: 'DESCRIPCION',
      validate: { len: [0, 250] },
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'COLOR',
      validate: { len: [1, 30] },
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'FECHA_CREACION',
    },
  },
  {
    sequelize,
    modelName: 'Lista',
    tableName: 'LISTAS',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['ID_CUENTA', 'NOMBRE'],
        name: 'UK_listas_cuenta_nombre',
      },
    ],
  }
);
