import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';
import { calcularPrecioReserva } from '../../domain/tarifas/TarifaService.js';

export async function listarTarifas(req, res) {
  try {
    const tarifas = await TarifaRepository.listar();
    res.json(tarifas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function crearTarifa(req, res) {
  try {
    const nuevaTarifa = await TarifaRepository.crear(req.body);
    res.status(201).json(nuevaTarifa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function calcularPrecio(req, res) {
  try {
    const { modalidad, horas } = req.query;
    const vehiculoId = req.params.vehiculoId;

    // Simulamos el vehículo (le asignamos categoría 1 por defecto para la prueba)
    const vehiculoSimulado = { id: vehiculoId, categoria_id: 1 }; 

    const precioFinal = await calcularPrecioReserva(vehiculoSimulado, Number(horas), modalidad);
    
    res.json({ precioTotal: precioFinal });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
export async function actualizarTarifa(req, res) {
  try {
    const tarifaActualizada = await TarifaRepository.actualizar(req.params.id, req.body);
    res.json(tarifaActualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function eliminarTarifa(req, res) {
  try {
    await TarifaRepository.eliminar(req.params.id);
    res.json({ mensaje: 'Tarifa eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}