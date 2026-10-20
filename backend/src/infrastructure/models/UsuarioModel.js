import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const UsuarioModel = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  rol: { 
    type: DataTypes.ENUM('CLIENTE', 'EMPLEADO', 'ADMINISTRADOR'), 
    defaultValue: 'CLIENTE' 
  },
  activo: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
}, { tableName: 'usuarios', timestamps: true });

export default UsuarioModel;