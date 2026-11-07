import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';

export async function eliminarVehiculo(id) {
  const eliminado = await VehiculoRepository.delete(id);
  if (!eliminado) throw new Error('Vehículo no encontrado');
  return true;
}