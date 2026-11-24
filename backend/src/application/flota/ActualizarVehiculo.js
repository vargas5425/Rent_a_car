
import { Op } from 'sequelize';

import {
  sequelize,
  AlquilerModel
} from '../../infrastructure/models/index.js';

import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';

import RegistrarCambioEstado from '../Historial/RegistrarCambioEstado.js';

const registrarCambioEstado = new RegistrarCambioEstado();

const TRANSICIONES_MANUALES = {
  DISPONIBLE: ['MANTENIMIENTO'],
  MANTENIMIENTO: ['DISPONIBLE'],
  ALQUILADA: []
};

export async function actualizarVehiculo(id, data, usuarioId) {

  // 1. Impedir modificaciones directas del atributo activo
  if (Object.prototype.hasOwnProperty.call(data, 'activo')) {
    throw new Error(
      'El atributo activo no puede modificarse directamente'
    );
  }

  return await sequelize.transaction(async (transaction) => {

    const options = {
      transaction,
      lock: transaction.LOCK.UPDATE
    };

    // 2. Buscar y bloquear el vehículo
    const vehiculo = await VehiculoRepository.findById(
      id,
      options
    );

    if (!vehiculo) {
      throw new Error('Vehículo no encontrado');
    }

    // 3. Verificar que el vehículo esté activo
    if (!vehiculo.activo) {
      throw new Error(
        'No se puede actualizar un vehículo inactivo'
      );
    }

    // 4. Guardar el estado anterior
    const estadoAnterior = vehiculo.estado;

    // 5. Validar cambios manuales de estado
    if (
      Object.prototype.hasOwnProperty.call(data, 'estado') &&
      data.estado !== estadoAnterior
    ) {

      const estadosPermitidos =
        TRANSICIONES_MANUALES[estadoAnterior] ?? [];

      if (!estadosPermitidos.includes(data.estado)) {
        throw new Error(
          `No se permite cambiar manualmente el estado de ${estadoAnterior} a ${data.estado}`
        );
      }

      // Verificar que no existan alquileres activos
      // o pendientes asociados al vehículo
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
          'No se puede cambiar el estado de un vehículo con alquileres pendientes o activos'
        );
      }
    }

    // 6. Actualizar los datos del vehículo
    const actualizado = await VehiculoRepository.update(
      id,
      data,
      { transaction }
    );

    if (!actualizado) {
      throw new Error('Vehículo no encontrado');
    }

    // 7. Obtener el nuevo estado
    const estadoNuevo = actualizado.estado;

    // 8. Registrar historial si cambió el estado
    if (estadoAnterior !== estadoNuevo) {

      await registrarCambioEstado.ejecutar({
        tipoEntidad: 'VEHICULO',
        entidadId: vehiculo.id,
        estadoAnterior,
        estadoNuevo,
        usuarioId,
        observacion: estadoNuevo === 'MANTENIMIENTO'
          ? 'Vehículo enviado a mantenimiento por el administrador'
          : 'Vehículo habilitado después del mantenimiento',
        transaction
      });
    }

    // 9. Retornar el vehículo actualizado
    return actualizado;
  });
}
