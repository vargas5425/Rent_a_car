import { Op } from 'sequelize';
import { sequelize, VehiculoModel, CategoriaModel, TarifaModel } from '../models/index.js'; // 👈 Importamos TarifaModel
import { ESTADOS_BLOQUEANTES } from '../../domain/reservas/Reserva.js';

class VehiculoRepository {
  async findAll() {
    return await VehiculoModel.findAll({
      where: { activo: true },
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' } // 👈 Incluimos las tarifas
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
        { model: TarifaModel, as: 'tarifas' } // 👈 Incluimos las tarifas
      ]
    });
  }

  async findById(id) {
    return await VehiculoModel.findByPk(id, {
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' } // 👈 Incluimos las tarifas
      ]
    });
  }

  async create(data) {
    return await VehiculoModel.create(data);
  }

  async update(id, data) {
    const vehiculo = await VehiculoModel.findByPk(id);
    if (!vehiculo) return null;
    return await vehiculo.update(data);
  }

  async delete(id) {
    const vehiculo = await VehiculoModel.findByPk(id);
    if (!vehiculo) return null;
    return await vehiculo.update({ activo: false }); 
  }
}

export default new VehiculoRepository();