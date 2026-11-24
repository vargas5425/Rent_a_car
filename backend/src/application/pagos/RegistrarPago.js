
import {
  sequelize,
  ReservaModel,
  AlquilerModel,
  CargoAdicionalModel,
  PagoModel
} from '../../infrastructure/models/index.js';

import {
  calcularSaldoReserva,
  validarMontoPago
} from './CalcularSaldoReserva.js';

export default class RegistrarPago {

  async ejecutar({
    reservaId,
    monto,
    metodoPago,
    referencia = null
  }) {

    const metodosPermitidos = [
      'EFECTIVO',
      'TRANSFERENCIA',
      'QR'
    ];

    if (!Number.isInteger(Number(reservaId)) ||
        Number(reservaId) <= 0) {
      throw new Error('La reserva indicada no es válida');
    }

    if (!metodosPermitidos.includes(metodoPago)) {
      throw new Error('Método de pago no válido');
    }

    return sequelize.transaction(async (transaction) => {

      // 1. Bloquear la reserva durante el pago
      const reserva = await ReservaModel.findByPk(
        reservaId,
        {
          transaction,
          lock: transaction.LOCK.UPDATE
        }
      );

      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }

      // 2. Buscar el alquiler asociado
      const alquiler = await AlquilerModel.findOne({
        where: {
          reserva_id: reserva.id
        },
        transaction
      });

      // 3. Obtener cargos adicionales
      const cargos = alquiler
        ? await CargoAdicionalModel.findAll({
            where: {
              alquiler_id: alquiler.id
            },
            transaction
          })
        : [];

      // 4. Obtener pagos confirmados
      const pagos = await PagoModel.findAll({
        where: {
          reserva_id: reserva.id,
          estado: 'CONFIRMADO'
        },
        transaction
      });

      // 5. Calcular el saldo
      const saldo = calcularSaldoReserva({
        totalReserva: reserva.total,
        cargosAdicionales: cargos,
        pagos
      });

      // 6. Validar que no se exceda el saldo
      validarMontoPago(
        monto,
        saldo.saldoPendiente
      );

      // 7. Registrar el pago confirmado
      const pago = await PagoModel.create(
        {
          reserva_id: reserva.id,
          monto: Number(monto),
          metodo_pago: metodoPago,
          referencia,
          estado: 'CONFIRMADO',
          fecha_pago: new Date()
        },
        { transaction }
      );

      return {
        pago: pago.toJSON(),
        saldoAnterior: saldo.saldoPendiente,
        saldoPendiente:
          Math.round(
            (saldo.saldoPendiente - Number(monto)) * 100
          ) / 100
      };

    });
  }
}
