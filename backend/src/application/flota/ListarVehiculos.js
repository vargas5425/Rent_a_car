import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';

export async function listarVehiculos() {
  return await VehiculoRepository.findAll();
}