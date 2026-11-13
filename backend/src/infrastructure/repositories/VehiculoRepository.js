
import { Op } from 'sequelize';

import {
  sequelize,
  VehiculoModel,
  CategoriaModel,
  TarifaModel
} from '../models/index.js';

import {
  ESTADOS_BLOQUEANTES
} from '../../domain/reservas/Reserva.js';

class VehiculoRepository {

  // ===================================
  // 1. LISTAR VEHÍCULOS ACTIVOS
  // ===================================

  async findAll() {
    return await VehiculoModel.findAll({
      where: { activo: true },
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' }
      ]
    });
  }

  // ===================================
  // 2. BUSCAR VEHÍCULOS DISPONIBLES
  // MÓDULO DE RESERVAS
  // ===================================

  async findDisponibles(inicio, fin) {
    const bloqueantes = ESTADOS_BLOQUEANTES
      .map((estado) => sequelize.escape(estado))
      .join(', ');

    const sinChoques = sequelize.literal(`
      NOT EXISTS (
        SELECT 1
        FROM reservas AS r
        WHERE r.vehiculo_id = \`Vehiculo\`.\`id\`
          AND r.estado IN (${bloqueantes})
          AND r.fecha_inicio < ${sequelize.escape(fin)}
          AND r.fecha_fin > ${sequelize.escape(inicio)}
      )
    `);

    return await VehiculoModel.findAll({
      where: {
        activo: true,
        estado: {
          [Op.ne]: 'MANTENIMIENTO'
        },
        [Op.and]: [sinChoques]
      },
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' }
      ]
    });
  }

  // ===================================
  // 3. BUSCAR VEHÍCULO POR ID
  // SOPORTA TRANSACCIONES
  // ===================================

  async findById(id, options = {}) {
    return await VehiculoModel.findByPk(id, {
      ...options,
      include: [
        { model: CategoriaModel, as: 'categoria' },
        { model: TarifaModel, as: 'tarifas' }
      ]
    });
  }

  // ===================================
  // 4. CREAR VEHÍCULO
  // ===================================

  async create(data) {
    return await VehiculoModel.create(data);
  }

  // ===================================
  // 5. ACTUALIZAR VEHÍCULO
  // SOPORTA TRANSACCIONES
  // ===================================

  async update(id, data, options = {}) {
    const vehiculo = await VehiculoModel.findByPk(
      id,
      options
    );

    if (!vehiculo) {
      return null;
    }

    return await vehiculo.update(data, options);
  }

  // ===================================
  // 6. ELIMINAR VEHÍCULO
  // BORRADO LÓGICO
  // ===================================

  async delete(id) {
    const vehiculo = await VehiculoModel.findByPk(id);

    if (!vehiculo) {
      return null;
    }

    return await vehiculo.update({
      activo: false
    });
  }
}

export default new VehiculoRepository();
