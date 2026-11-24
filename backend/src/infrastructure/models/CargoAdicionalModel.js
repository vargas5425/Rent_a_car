// backend/src/infrastructure/models/CargoAdicionalModel.js
import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const CargoAdicionalModel = sequelize.define('CargoAdicional', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alquiler_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'alquileres',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  tipo: {
    type: DataTypes.ENUM('DANIO', 'LIMPIEZA', 'KILOMETRAJE', 'OTRO', 'RETRASO', 'COMBUSTIBLE'),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha_cargo: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cargos_adicionales',
  timestamps: true
});

export default CargoAdicionalModel;