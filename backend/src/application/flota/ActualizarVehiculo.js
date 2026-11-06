import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';

export async function actualizarVehiculo(id, data) {
  const actualizado = await VehiculoRepository.update(id, data);
  if (!actualizado) throw new Error('Vehículo no encontrado');
  return actualizado;
}