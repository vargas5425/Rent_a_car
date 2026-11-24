
import { PagoModel } from '../models/index.js';

class PagosRepository {

  async crear(datos, options = {}) {
    const pago = await PagoModel.create(datos, options);
    return pago.toJSON();
  }

  async buscarPorId(id, options = {}) {
    const pago = await PagoModel.findByPk(id, options);
    return pago ? pago.toJSON() : null;
  }

  async listarPorReserva(reservaId, options = {}) {
    const pagos = await PagoModel.findAll({
      ...options,
      where: { reserva_id: reservaId },
      order: [['fecha_pago', 'DESC']]
    });

    return pagos.map(pago => pago.toJSON());
  }

  async listarTodos(options = {}) {
    const pagos = await PagoModel.findAll({
      ...options,
      order: [['fecha_pago', 'DESC']]
    });

    return pagos.map(pago => pago.toJSON());
  }

  async calcularTotalPagado(reservaId, options = {}) {
    const total = await PagoModel.sum('monto', {
      ...options,
      where: {
        reserva_id: reservaId,
        estado: 'CONFIRMADO'
      }
    });

    return Number(total || 0);
  }

}

export default new PagosRepository();
