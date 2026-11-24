
import { Op } from 'sequelize';

import {
  sequelize,
  ReservaModel,
  AlquilerModel
} from '../../infrastructure/models/index.js';

import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';

import RegistrarCambioEstado from '../Historial/RegistrarCambioEstado.js';

import {
  ESTADOS_BLOQUEANTES
} from '../../domain/reservas/Reserva.js';

const registrarCambioEstado = new RegistrarCambioEstado();

export async function eliminarVehiculo(id, usuarioId) {

  return await sequelize.transaction(async (transaction) => {

    const options = {
      transaction,
      lock: transaction.LOCK.UPDATE
    };

    // 1. Buscar y bloquear el vehículo
    const vehiculo = await VehiculoRepository.findById(
      id,
      options
    );

    if (!vehiculo) {
      throw new Error('Vehículo no encontrado');
    }

    // 2. Evitar bajas duplicadas
    if (!vehiculo.activo) {
      throw new Error('El vehículo ya se encuentra inactivo');
    }

    // 3. Verificar estado del vehículo
    if (vehiculo.estado === 'ALQUILADA') {
      throw new Error(
        'No se puede dar de baja un vehículo alquilado'
      );
    }

    // 4. Verificar reservas vigentes
    const reservaVigente = await ReservaModel.findOne({
      where: {
        vehiculo_id: vehiculo.id,
        estado: {
          [Op.in]: ESTADOS_BLOQUEANTES
        }
      },
      transaction
    });

    if (reservaVigente) {
      throw new Error(
        'No se puede dar de baja un vehículo con reservas vigentes'
      );
    }

    // 5. Verificar alquileres pendientes o activos
    const alquilerVigente = await AlquilerModel.findOne({
      where: {
        vehiculo_id: vehiculo.id,
        estado: {
          [Op.in]: ['PENDIENTE', 'ACTIVO']
        }
      },
      transaction
    });

    if (alquilerVigente) {
      throw new Error(
        'No se puede dar de baja un vehículo con alquileres pendientes o activos'
      );
    }

    // 6. Realizar baja lógica
    const eliminado = await VehiculoRepository.delete(
      id,
      { transaction }
    );

    if (!eliminado) {
      throw new Error('Vehículo no encontrado');
    }

    // 7. Registrar historial administrativo
    await registrarCambioEstado.ejecutar({
      tipoEntidad: 'VEHICULO',
      entidadId: vehiculo.id,
      estadoAnterior: 'ACTIVO',
      estadoNuevo: 'INACTIVO',
      usuarioId,
      observacion: 'Baja lógica administrativa del vehículo',
      transaction
    });

    return true;
  });
}
