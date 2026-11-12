import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';

export async function listarTarifas() {
  return await TarifaRepository.listar();
}