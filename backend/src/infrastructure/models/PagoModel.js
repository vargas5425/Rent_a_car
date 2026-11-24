
import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const PagoModel = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reservas',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },

  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },

  metodo_pago: {
    type: DataTypes.ENUM(
      'EFECTIVO',
      'TRANSFERENCIA',
      'QR'
    ),
    allowNull: false
  },

  estado: {
    type: DataTypes.ENUM(
      'PENDIENTE',
      'CONFIRMADO',
      'ANULADO'
    ),
    allowNull: false,
    defaultValue: 'CONFIRMADO'
  },

  referencia: {
    type: DataTypes.STRING(150),
    allowNull: true
  },

  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'pagos',
  timestamps: true,
  indexes: [
    {
      fields: ['reserva_id']
    }
  ]
});

export default PagoModel;
