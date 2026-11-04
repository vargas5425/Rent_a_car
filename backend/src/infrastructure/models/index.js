import sequelize from '../database/sequelize.js';
import UsuarioModel from './UsuarioModel.js';
import CategoriaModel from './CategoriaModel.js';
import VehiculoModel from './VehiculoModel.js';
import AlquilerModel from './AlquilerModel.js';
import CargoAdicionalModel from './CargoAdicionalModel.js';

// Relaciones de la Base de Datos
CategoriaModel.hasMany(VehiculoModel, { foreignKey: 'categoria_id', as: 'vehiculos' });
VehiculoModel.belongsTo(CategoriaModel, { foreignKey: 'categoria_id', as: 'categoria' });

// Relaciones de Alquiler
UsuarioModel.hasMany(AlquilerModel, {
  foreignKey: 'usuario_id',
  as: 'alquileres'
});

AlquilerModel.belongsTo(UsuarioModel, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

VehiculoModel.hasMany(AlquilerModel, {
  foreignKey: 'vehiculo_id',
  as: 'alquileres'
});

AlquilerModel.belongsTo(VehiculoModel, {
  foreignKey: 'vehiculo_id',
  as: 'vehiculo'
});

// ===================================
// RELACIÓN ALQUILER - CARGO ADICIONAL
// ===================================

// Un alquiler puede tener varios cargos
AlquilerModel.hasMany(CargoAdicionalModel, {
  foreignKey: 'alquiler_id',
  as: 'cargosAdicionales'
});

// Un cargo pertenece a un alquiler
CargoAdicionalModel.belongsTo(AlquilerModel, {
  foreignKey: 'alquiler_id',
  as: 'alquiler'
});

export {
  sequelize,
  UsuarioModel,
  CategoriaModel,
  VehiculoModel,
  AlquilerModel,
  CargoAdicionalModel
};