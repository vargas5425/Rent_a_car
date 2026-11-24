import sequelize from '../database/sequelize.js';
import UsuarioModel from './UsuarioModel.js';
import CategoriaModel from './CategoriaModel.js';
import VehiculoModel from './VehiculoModel.js';
import ReservaModel from './ReservaModel.js';
import TarifaModel from './TarifaModel.js';
import AlquilerModel from './AlquilerModel.js';
import CargoAdicionalModel from './CargoAdicionalModel.js';

// Relaciones de la Base de Datos
CategoriaModel.hasMany(VehiculoModel, { foreignKey: 'categoria_id', as: 'vehiculos' });
VehiculoModel.belongsTo(CategoriaModel, { foreignKey: 'categoria_id', as: 'categoria' });

UsuarioModel.hasMany(ReservaModel, { foreignKey: 'usuario_id', as: 'reservas' });
ReservaModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id', as: 'usuario' });

VehiculoModel.hasMany(ReservaModel, { foreignKey: 'vehiculo_id', as: 'reservas' });
ReservaModel.belongsTo(VehiculoModel, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

// Relaciones de Tarifas
VehiculoModel.hasMany(TarifaModel, { foreignKey: 'vehiculo_id', as: 'tarifas' });
TarifaModel.belongsTo(VehiculoModel, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

CategoriaModel.hasMany(TarifaModel, { foreignKey: 'categoria_id', as: 'tarifas' });
TarifaModel.belongsTo(CategoriaModel, { foreignKey: 'categoria_id', as: 'categoria' });

// Relaciones de Alquileres
UsuarioModel.hasMany(AlquilerModel, { foreignKey: 'usuario_id', as: 'alquileres' });
AlquilerModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id', as: 'usuario' });

UsuarioModel.hasMany(AlquilerModel, { foreignKey: 'empleado_entrega_id', as: 'entregasRealizadas' });
AlquilerModel.belongsTo(UsuarioModel, { foreignKey: 'empleado_entrega_id', as: 'empleadoEntrega' });

VehiculoModel.hasMany(AlquilerModel, { foreignKey: 'vehiculo_id', as: 'alquileres' });
AlquilerModel.belongsTo(VehiculoModel, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

ReservaModel.hasOne(AlquilerModel, { foreignKey: 'reserva_id', as: 'alquiler' });
AlquilerModel.belongsTo(ReservaModel, { foreignKey: 'reserva_id', as: 'reserva' });

AlquilerModel.hasMany(CargoAdicionalModel, { foreignKey: 'alquiler_id', as: 'cargos' });
CargoAdicionalModel.belongsTo(AlquilerModel, { foreignKey: 'alquiler_id', as: 'alquiler' });

export {
  sequelize,
  UsuarioModel,
  CategoriaModel,
  VehiculoModel,
  ReservaModel,
  TarifaModel,
  AlquilerModel,
  CargoAdicionalModel,
};