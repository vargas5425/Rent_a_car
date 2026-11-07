import sequelize from '../database/sequelize.js';
import UsuarioModel from './UsuarioModel.js';
import CategoriaModel from './CategoriaModel.js';
import VehiculoModel from './VehiculoModel.js';
import TarifaModel from './TarifaModel.js';

// Relaciones de la Base de Datos
CategoriaModel.hasMany(VehiculoModel, { foreignKey: 'categoria_id', as: 'vehiculos' });
VehiculoModel.belongsTo(CategoriaModel, { foreignKey: 'categoria_id', as: 'categoria' });

VehiculoModel.hasMany(TarifaModel, { foreignKey: 'vehiculo_id', as: 'tarifas' });
TarifaModel.belongsTo(VehiculoModel, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

CategoriaModel.hasMany(TarifaModel, { foreignKey: 'categoria_id', as: 'tarifas' });
TarifaModel.belongsTo(CategoriaModel, { foreignKey: 'categoria_id', as: 'categoria' });

export {
  sequelize,
  UsuarioModel,
  CategoriaModel,
  VehiculoModel,
  TarifaModel
};