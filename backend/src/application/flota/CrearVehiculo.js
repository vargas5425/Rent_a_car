import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';

export async function crearVehiculo({ placa, marca, modelo, anio, categoria_id, transmision, pasajeros, kilometraje_actual, imagen_url }) {
  // 1. Validaciones básicas
  if (!placa || !marca || !modelo || !anio || !categoria_id) {
    throw new Error('Faltan campos obligatorios');
  }
  
  if (anio < 1900 || anio > new Date().getFullYear() + 1) {
    throw new Error('El año del vehículo no es válido');
  }

  // 2. Crear en la base de datos
  const nuevoVehiculo = await VehiculoRepository.create({
    placa,
    marca,
    modelo,
    anio,
    categoria_id,
    transmision: transmision || 'MANUAL',
    pasajeros: pasajeros || 5,
    kilometraje_actual: kilometraje_actual || 0,
    estado: 'DISPONIBLE', 
    imagen_url: imagen_url || 'https://via.placeholder.com/300x200?text=Auto',
    activo: true
  });

  return nuevoVehiculo;
}