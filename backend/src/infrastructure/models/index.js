import sequelize from '../database/sequelize.js';
import UsuarioModel from './UsuarioModel.js';
import CategoriaModel from './CategoriaModel.js';
import VehiculoModel from './VehiculoModel.js';
import ReservaModel from './ReservaModel.js';

// Relaciones de la Base de Datos
CategoriaModel.hasMany(VehiculoModel, { foreignKey: 'categoria_id', as: 'vehiculos' });
VehiculoModel.belongsTo(CategoriaModel, { foreignKey: 'categoria_id', as: 'categoria' });

UsuarioModel.hasMany(ReservaModel, { foreignKey: 'usuario_id', as: 'reservas' });
ReservaModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id', as: 'usuario' });

VehiculoModel.hasMany(ReservaModel, { foreignKey: 'vehiculo_id', as: 'reservas' });
ReservaModel.belongsTo(VehiculoModel, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

export {
  sequelize,
  UsuarioModel,
  CategoriaModel,
  VehiculoModel,
  ReservaModel
};