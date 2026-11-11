
import sequelize from '../database/sequelize.js';

import UsuarioModel from './UsuarioModel.js';
import CategoriaModel from './CategoriaModel.js';
import VehiculoModel from './VehiculoModel.js';

// Modelos del módulo de alquileres
import AlquilerModel from './AlquilerModel.js';
import CargoAdicionalModel from './CargoAdicionalModel.js';

// Modelo del módulo de reservas
import ReservaModel from './ReservaModel.js';

// ===================================
// RELACIONES DE CATEGORÍAS Y VEHÍCULOS
// ===================================

CategoriaModel.hasMany(VehiculoModel, {
  foreignKey: 'categoria_id',
  as: 'vehiculos'
});

VehiculoModel.belongsTo(CategoriaModel, {
  foreignKey: 'categoria_id',
  as: 'categoria'
});

// ===================================
// RELACIONES DE RESERVAS
// ===================================

UsuarioModel.hasMany(ReservaModel, {
  foreignKey: 'usuario_id',
  as: 'reservas'
});

ReservaModel.belongsTo(UsuarioModel, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

VehiculoModel.hasMany(ReservaModel, {
  foreignKey: 'vehiculo_id',
  as: 'reservas'
});

ReservaModel.belongsTo(VehiculoModel, {
  foreignKey: 'vehiculo_id',
  as: 'vehiculo'
});

// ===================================
// RELACIONES DE ALQUILERES
// ===================================

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
// RELACIONES DE CARGOS ADICIONALES
// ===================================

AlquilerModel.hasMany(CargoAdicionalModel, {
  foreignKey: 'alquiler_id',
  as: 'cargosAdicionales'
});

CargoAdicionalModel.belongsTo(AlquilerModel, {
  foreignKey: 'alquiler_id',
  as: 'alquiler'
});

// ===================================
// EXPORTACIÓN DE MODELOS
// ===================================

export {
  sequelize,
  UsuarioModel,
  CategoriaModel,
  VehiculoModel,
  ReservaModel,
  AlquilerModel,
  CargoAdicionalModel
};
