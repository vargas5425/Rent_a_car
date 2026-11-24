
import {
  sequelize,
  ReservaModel,
  AlquilerModel,
  CargoAdicionalModel,
  PagoModel
} from '../../infrastructure/models/index.js';

import {
  calcularSaldoReserva
} from './CalcularSaldoReserva.js';

export default class ConsultarSaldoReserva {

  async ejecutar(reservaId) {

    const id = Number(reservaId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('La reserva indicada no es válida');
    }

    return sequelize.transaction(async (transaction) => {

      // 1. Buscar la reserva
      const reserva = await ReservaModel.findByPk(id, {
        transaction
      });

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

      // 4. Obtener pagos de la reserva
      const pagos = await PagoModel.findAll({
        where: {
          reserva_id: reserva.id
        },
        transaction
      });

      // 5. Calcular el saldo
      const saldo = calcularSaldoReserva({
        totalReserva: reserva.total,
        cargosAdicionales: cargos,
        pagos
      });

      return {
        reservaId: reserva.id,
        ...saldo
      };
    });
  }
}
