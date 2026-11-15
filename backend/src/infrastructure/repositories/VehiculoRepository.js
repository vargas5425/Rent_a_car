
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

 
  // ===================================
  // 2. BUSCAR VEHÍCULOS DISPONIBLES
  // VALIDAR RESERVAS Y ALQUILERES
  // ===================================

  async findDisponibles(inicio, fin) {
    const bloqueantes = ESTADOS_BLOQUEANTES
      .map((estado) => sequelize.escape(estado))
      .join(', ');

    // 1. Verificar que no existan reservas
    // que se crucen con el período solicitado
    const sinChoquesReservas = sequelize.literal(`
      NOT EXISTS (
        SELECT 1
        FROM reservas AS r
        WHERE r.vehiculo_id = \`Vehiculo\`.\`id\`
          AND r.estado IN (${bloqueantes})
          AND r.fecha_inicio < ${sequelize.escape(fin)}
          AND r.fecha_fin > ${sequelize.escape(inicio)}
      )
    `);

    // 2. Verificar que no existan alquileres
    // pendientes o activos que se crucen con las fechas
    
    const sinChoquesAlquileres = sequelize.literal(`
      NOT EXISTS (
        SELECT 1
        FROM alquileres AS a
        WHERE a.vehiculo_id = \`Vehiculo\`.\`id\`
          AND (
            a.estado = 'ACTIVO'
            OR (
              a.estado = 'PENDIENTE'
              AND a.fecha_inicio < ${sequelize.escape(fin)}
              AND a.fecha_fin > ${sequelize.escape(inicio)}
            )
          )
      )
    `);


    // 3. Buscar vehículos que cumplan ambas condiciones
    return await VehiculoModel.findAll({
      where: {
        activo: true,
        estado: {
          [Op.ne]: 'MANTENIMIENTO'
        },
        [Op.and]: [
          sinChoquesReservas,
          sinChoquesAlquileres
        ]
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

  
  // ===================================
  // 3. BUSCAR VEHÍCULO POR ID
  // SOPORTA TRANSACCIONES Y BLOQUEOS
  // ===================================

  async findById(id, options = {}) {

    // Si la consulta solicita un bloqueo,
    // buscar únicamente el vehículo.
    // No cargar categoría ni tarifas.
    if (options.lock) {
      return await VehiculoModel.findByPk(id, {
        ...options
      });
    }

    // Consulta normal: incluir relaciones
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
