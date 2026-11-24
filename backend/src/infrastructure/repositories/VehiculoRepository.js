import { Op } from 'sequelize';
import { sequelize, VehiculoModel, CategoriaModel, TarifaModel } from '../models/index.js';
import { ESTADOS_BLOQUEANTES } from '../../domain/reservas/Reserva.js';

class VehiculoRepository {
  async findAll(options = {}) {
    return await VehiculoModel.findAll({
      ...options,
      where: { activo: true, ...(options.where || {}) },
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' }
      ]
    });
  }

  async findDisponibles(inicio, fin) {
    const bloqueantes = ESTADOS_BLOQUEANTES.map((estado) => sequelize.escape(estado)).join(', ');
    const sinChoques = sequelize.literal(`NOT EXISTS (
      SELECT 1 FROM reservas AS r
      WHERE r.vehiculo_id = \`Vehiculo\`.\`id\`
        AND r.estado IN (${bloqueantes})
        AND r.fecha_inicio < ${sequelize.escape(fin)}
        AND r.fecha_fin > ${sequelize.escape(inicio)}
    )`);

    return await VehiculoModel.findAll({
      where: {
        activo: true,
        estado: { [Op.ne]: 'MANTENIMIENTO' },
        [Op.and]: [sinChoques]
      },
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' }
      ]
    });
  }

  // 👇 AHORA acepta options (transaction + lock)
  async findById(id, options = {}) {
    return await VehiculoModel.findByPk(id, {
      ...options,
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' }
      ]
    });
  }

  async create(data, options = {}) {
    return await VehiculoModel.create(data, options);
  }

  // 👇 AHORA respeta la transacción
  async update(id, data, options = {}) {
    const vehiculo = await VehiculoModel.findByPk(id, {
      transaction: options.transaction
    });
    if (!vehiculo) return null;
    return await vehiculo.update(data, {
      transaction: options.transaction
    });
  }

  async delete(id, options = {}) {
    const vehiculo = await VehiculoModel.findByPk(id, {
      transaction: options.transaction
    });
    if (!vehiculo) return null;
    return await vehiculo.update({ activo: false }, {
      transaction: options.transaction
    });
  }
}

export default new VehiculoRepository();