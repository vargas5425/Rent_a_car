
import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const HistorialEstadoModel = sequelize.define(
  'HistorialEstado',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    tipo_entidad: {
      type: DataTypes.ENUM(
        'RESERVA',
        'ALQUILER',
        'VEHICULO'
      ),
      allowNull: false
    },

    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    estado_anterior: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    estado_nuevo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    observacion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    fecha_cambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'historial_estados',
    timestamps: true
  }
);

export default HistorialEstadoModel;
