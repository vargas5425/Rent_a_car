import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';

export async function actualizarTarifa(id, datos) {
  const tarifa = await TarifaRepository.actualizar(id, datos);
  return tarifa;
}

export async function eliminarTarifa(id) {
  await TarifaRepository.eliminar(id);
  return true;
}