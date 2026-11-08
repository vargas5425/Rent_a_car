import { Op } from 'sequelize';
import { sequelize, VehiculoModel, CategoriaModel } from '../models/index.js';
import { ESTADOS_BLOQUEANTES } from '../../domain/reservas/Reserva.js';

class VehiculoRepository {
  async findAll() {
    // Trae todos los vehículos e incluye los datos de su categoría (JOIN)
    return await VehiculoModel.findAll({
      where: { activo: true },
      include: [{ model: CategoriaModel, as: 'categoria' }]
    });
  }

  // Vehículos que se pueden reservar en [inicio, fin): activos, fuera de MANTENIMIENTO y sin
  // ninguna reserva bloqueante que choque con el intervalo.
  // Es UNA sola consulta (NOT EXISTS) que aprovecha el índice reservas_vehiculo_intervalo,
  // en vez de traer toda la flota y filtrar en Node.
  // Los valores se pasan por sequelize.escape(), nunca concatenados a mano.
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
      include: [{ model: CategoriaModel, as: 'categoria' }]
    });
  }

  async findById(id) {
    return await VehiculoModel.findByPk(id, {
      include: [{ model: CategoriaModel, as: 'categoria' }]
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
    // Borrado lógico (recomendado)
    return await vehiculo.update({ activo: false }); 
  }
}

export default new VehiculoRepository();