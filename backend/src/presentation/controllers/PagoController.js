import { registrarPago } from '../../application/pagos/RegistrarPago.js';
import pagoRepo from '../../infrastructure/repositories/PagoRepository.js';
import alquilerRepo from '../../infrastructure/repositories/AlquileresRepository.js';

function responderError(res, error) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message, codigo: error.codigo });
  }
  if (error instanceof Error && error.message) {
    const msg = error.message.toLowerCase();
    const esConflicto =
      msg.includes('no se pueden registrar') ||
      msg.includes('no tiene saldo pendiente') ||
      msg.includes('cancelado');
    return res.status(esConflicto ? 409 : 400).json({ error: error.message });
  }
  console.error('Error en PagoController:', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

export async function postRegistrarPago(req, res) {
  try {
    const resultado = await registrarPago(req.params.id, req.body);
    return res.status(201).json(resultado);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function getPagosPorAlquiler(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'El ID del alquiler no es válido' });
    }

    const alquiler = await alquilerRepo.buscarPorId(id);
    if (!alquiler) {
      return res.status(404).json({ error: 'El alquiler no existe' });
    }

    const pagos = await pagoRepo.listarPorAlquiler(id);
    const totalPagado = await pagoRepo.calcularTotalPagado(id);
    const montoTotal = Number(alquiler.monto_total || 0);
    const depositoGarantia = Number(alquiler.deposito_garantia || 0);
    const saldoPendiente = Math.max(
      0,
      Math.round((montoTotal - totalPagado - depositoGarantia) * 100) / 100
    );

    return res.status(200).json({
      alquiler_id: id,
      monto_total: montoTotal,
      deposito_garantia: depositoGarantia,
      total_pagado: totalPagado,
      saldo_pendiente: saldoPendiente,
      total: pagos.length,
      pagos
    });
  } catch (error) {
    return responderError(res, error);
  }
}