import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';

export async function crearTarifa({ modalidad, precio, vehiculo_id, categoria_id }) {
  if (!modalidad || !precio) {
    throw new Error('La modalidad y el precio son obligatorios');
  }
  if (!vehiculo_id && !categoria_id) {
    throw new Error('La tarifa debe estar asociada a un vehículo o a una categoría');
  }

  return await TarifaRepository.crear({
    modalidad,
    precio,
    vehiculo_id: vehiculo_id || null,
    categoria_id: categoria_id || null
  });
}