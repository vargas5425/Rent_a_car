import { sequelize } from '../../infrastructure/models/index.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import PagoRepository from '../../infrastructure/repositories/PagoRepository.js';
import { errorValidacion, errorNoEncontrada, errorConflicto } from '../../domain/reservas/ReservaError.js';

const TIPOS_PAGO_VALIDOS = ['ANTICIPO', 'PAGO_PARCIAL', 'TOTAL'];

export async function registrarPago(alquilerId, datos = {}) {
  const id = Number(alquilerId);
  const monto = Number(datos.monto);
  const tipo = typeof datos.tipo === 'string' ? datos.tipo.trim().toUpperCase() : '';
  const metodoPago = typeof datos.metodo_pago === 'string' ? datos.metodo_pago.trim().toUpperCase() : '';

  if (!Number.isInteger(id) || id <= 0) {
    throw errorValidacion('El ID del alquiler no es válido');
  }

  if (!Number.isFinite(monto) || monto <= 0) {
    throw errorValidacion('El monto del pago debe ser mayor a 0');
  }

  if (!TIPOS_PAGO_VALIDOS.includes(tipo)) {
    throw errorValidacion('El tipo de pago debe ser ANTICIPO, PAGO_PARCIAL o TOTAL');
  }

  if (!metodoPago) {
    throw errorValidacion('Debes indicar el método de pago');
  }

  let fechaPago = new Date();
  if (datos.fecha_pago !== undefined && datos.fecha_pago !== null && datos.fecha_pago !== '') {
    const parsedFecha = new Date(datos.fecha_pago);
    if (Number.isNaN(parsedFecha.getTime())) {
      throw errorValidacion('La fecha de pago no es válida');
    }
    fechaPago = parsedFecha;
  }

  return await sequelize.transaction(async (transaction) => {
    const options = { transaction, lock: transaction.LOCK.UPDATE };

    const alquiler = await AlquileresRepository.buscarPorId(id, options);
    if (!alquiler) {
      throw errorNoEncontrada('El alquiler no existe');
    }

    if (alquiler.estado === 'CANCELADO') {
      throw errorConflicto('No se pueden registrar pagos en un alquiler cancelado');
    }

    const montoTotal = Number(alquiler.monto_total || 0);
    const depositoGarantia = Number(alquiler.deposito_garantia || 0);
    const totalPagadoActual = await PagoRepository.calcularTotalPagado(id, { transaction });

    const saldoPendienteActual = Math.max(
      0,
      Math.round((montoTotal - totalPagadoActual - depositoGarantia) * 100) / 100
    );

    const montoRedondeado = Math.round(monto * 100) / 100;

    if (saldoPendienteActual <= 0) {
      throw errorConflicto('El alquiler ya no tiene saldo pendiente por pagar');
    }

    if (montoRedondeado > saldoPendienteActual) {
      throw errorValidacion(
        `El monto del pago (${montoRedondeado.toFixed(2)}) excede el saldo pendiente (${saldoPendienteActual.toFixed(2)})`
      );
    }

    const pagoCreado = await PagoRepository.crear({
      alquiler_id: id,
      monto: montoRedondeado,
      metodo_pago: metodoPago,
      fecha_pago: fechaPago,
      tipo
    }, { transaction });

    const nuevoTotalPagado = Math.round((totalPagadoActual + montoRedondeado) * 100) / 100;
    const nuevoSaldoPendiente = Math.max(
      0,
      Math.round((montoTotal - nuevoTotalPagado - depositoGarantia) * 100) / 100
    );

    return {
      mensaje: 'Pago registrado correctamente',
      pago: pagoCreado,
      resumen_pagos: {
        alquiler_id: id,
        monto_total: montoTotal,
        deposito_garantia: depositoGarantia,
        total_pagado: nuevoTotalPagado,
        saldo_pendiente: nuevoSaldoPendiente
      }
    };
  });
}