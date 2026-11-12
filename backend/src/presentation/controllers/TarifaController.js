import { listarTarifas as listarTarifasUseCase } from '../../application/tarifas/ListarTarifas.js';
import { crearTarifa as crearTarifaUseCase } from '../../application/tarifas/CrearTarifa.js';
import { actualizarTarifa as actualizarTarifaUseCase, eliminarTarifa as eliminarTarifaUseCase } from '../../application/tarifas/ActualizarTarifa.js';
import { calcularPrecioReserva } from '../../domain/tarifas/TarifaService.js';
import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';

export async function listarTarifas(req, res) {
  try {
    const tarifas = await listarTarifasUseCase();
    res.json(tarifas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function crearTarifa(req, res) {
  try {
    const nuevaTarifa = await crearTarifaUseCase(req.body);
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

    // Le inyectamos el TarifaRepository al servicio de dominio
    const precioFinal = await calcularPrecioReserva(vehiculoSimulado, Number(horas), modalidad, TarifaRepository);
    
    res.json({ precioTotal: precioFinal });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function actualizarTarifa(req, res) {
  try {
    const tarifaActualizada = await actualizarTarifaUseCase(req.params.id, req.body);
    res.json(tarifaActualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function eliminarTarifa(req, res) {
  try {
    await eliminarTarifaUseCase(req.params.id);
    res.json({ mensaje: 'Tarifa eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}