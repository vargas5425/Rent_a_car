import { PagoModel } from '../models/index.js';

class PagoRepository {
  async crear(datos, options = {}) {
    const pago = await PagoModel.create(datos, options);
    return pago.toJSON();
  }

  async buscarPorId(id, options = {}) {
    const pago = await PagoModel.findByPk(id, options);
    return pago ? pago.toJSON() : null;
  }

  async listarPorAlquiler(alquilerId, options = {}) {
    const pagos = await PagoModel.findAll({
      ...options,
      where: {
        alquiler_id: alquilerId
      },
      order: [['fecha_pago', 'DESC'], ['id', 'DESC']]
    });
    return pagos.map(pago => pago.toJSON());
  }

  async calcularTotalPagado(alquilerId, options = {}) {
    const total = await PagoModel.sum('monto', {
      ...options,
      where: {
        alquiler_id: alquilerId
      }
    });

    return Math.round(Number(total ?? 0) * 100) / 100;
  }
}

export default new PagoRepository();