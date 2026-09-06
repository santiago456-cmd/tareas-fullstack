import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Cuenta extends Model {}

Cuenta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID_CUENTA',
    },
    keycloakSub: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      field: 'KEYCLOAK_SUB',
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'USERNAME',
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'EMAIL',
    },
  },
  {
    sequelize,
    modelName: 'Cuenta',
    tableName: 'CUENTAS',
    timestamps: false,
  }
);
