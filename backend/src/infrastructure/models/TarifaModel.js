import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const TarifaModel = sequelize.define('Tarifa', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  modalidad: { 
    type: DataTypes.ENUM('HORA', 'DIA', 'SEMANA', 'MES'), 
    allowNull: false 
  },
  precio: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false,
    validate: {
      min: 0 // El precio no puede ser negativo
    }
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: { model: 'vehiculos', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: { model: 'categorias', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, { 
  tableName: 'tarifas', 
  timestamps: true,
  validate: {
    tieneAsignacion() {
      if (!this.vehiculo_id && !this.categoria_id) {
        throw new Error('La tarifa debe estar asociada a un vehículo o a una categoría');
      }
    }
  }
});

export default TarifaModel;