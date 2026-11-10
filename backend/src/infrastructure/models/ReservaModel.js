import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const ReservaModel = sequelize.define('Reserva', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'vehiculos', key: 'id' }
  },
  fecha_inicio: { type: DataTypes.DATE, allowNull: false },
  fecha_fin: { type: DataTypes.DATE, allowNull: false },
  modalidad: { type: DataTypes.ENUM('HORA', 'DIA', 'SEMANA', 'MES'), allowNull: false },
  precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: {
    type: DataTypes.ENUM('RESERVADA', 'CONFIRMADA', 'ENTREGADA', 'DEVUELTA', 'FINALIZADA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'RESERVADA'
  }
}, { tableName: 'reservas', timestamps: true });

export default ReservaModel;