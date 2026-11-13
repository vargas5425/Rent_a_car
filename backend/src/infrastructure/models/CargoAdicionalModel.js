
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
    }
  },

  tipo: {
    type: DataTypes.ENUM(
      'RETRASO',
      'COMBUSTIBLE',
      'DANIO',
      'LIMPIEZA',
      'KILOMETRAJE',
      'OTRO'
    ),
    allowNull: false
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
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
