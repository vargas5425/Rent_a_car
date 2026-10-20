import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const CategoriaModel = sequelize.define('Categoria', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descripcion: { type: DataTypes.TEXT }
}, { tableName: 'categorias', timestamps: true });

export default CategoriaModel;