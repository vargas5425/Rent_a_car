import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const PagoModel = sequelize.define('Pago', {
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
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tipo: {
    type: DataTypes.ENUM('ANTICIPO', 'PAGO_PARCIAL', 'TOTAL'),
    allowNull: false
  }
}, {
  tableName: 'pagos',
  timestamps: true
});

export default PagoModel;