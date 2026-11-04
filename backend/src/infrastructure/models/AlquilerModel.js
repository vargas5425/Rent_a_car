
import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const AlquilerModel = sequelize.define('Alquiler', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },

  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vehiculos',
      key: 'id'
    }
  },

  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false
  },

  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: false
  },

  fecha_entrega: {
    type: DataTypes.DATE,
    allowNull: true
  },

  fecha_devolucion: {
    type: DataTypes.DATE,
    allowNull: true
  },

  kilometraje_inicial: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  kilometraje_final: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  combustible_inicial: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  combustible_final: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  tarifa_diaria: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  monto_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  estado: {
    type: DataTypes.ENUM(
      'PENDIENTE',
      'ACTIVO',
      'FINALIZADO',
      'CANCELADO'
    ),
    allowNull: false,
    defaultValue: 'PENDIENTE'
  }

}, {
  tableName: 'alquileres',
  timestamps: true
});

export default AlquilerModel;
