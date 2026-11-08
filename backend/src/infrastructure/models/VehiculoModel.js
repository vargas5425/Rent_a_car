import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const VehiculoModel = sequelize.define('Vehiculo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  placa: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  marca: { type: DataTypes.STRING(50), allowNull: false },
  modelo: { type: DataTypes.STRING(50), allowNull: false },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  categoria_id: { 
    type: DataTypes.INTEGER,
    references: { model: 'categorias', key: 'id' }
  },
  transmision: { type: DataTypes.ENUM('MANUAL', 'AUTOMATICA'), defaultValue: 'MANUAL' },
  pasajeros: { type: DataTypes.INTEGER, allowNull: false },
  kilometraje_actual: { type: DataTypes.INTEGER, defaultValue: 0 },
  precio_hora: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 40 },
  precio_dia: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 300 },
  estado: { type: DataTypes.ENUM('DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'MANTENIMIENTO'), defaultValue: 'DISPONIBLE' },
  imagen_url: { type: DataTypes.STRING(255) },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'vehiculos', timestamps: true });

export default VehiculoModel;