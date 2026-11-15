
import { sequelize } from '../../infrastructure/models/index.js';

import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import { VehiculoModel } from '../../infrastructure/models/index.js';

export async function crearAlquilerDesdeReserva(reservaId) {
  const id = Number(reservaId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('El ID de la reserva no es válido');
  }

  return await sequelize.transaction(async (transaction) => {
    const options = {
      transaction,
      lock: transaction.LOCK.UPDATE
    };

    
    // 1. Consultar la reserva sin bloquear
    // para identificar el vehículo asociado
    const reservaInicial = await ReservaRepository.buscarPorIdTransaccional(
      id,
      { transaction }
    );

    if (!reservaInicial) {
      throw new Error('La reserva no existe');
    }

    // 2. Bloquear primero el vehículo
    const vehiculo = await VehiculoModel.findByPk(
      reservaInicial.vehiculo_id,
      {
        transaction,
        lock: transaction.LOCK.UPDATE
      }
    );

    if (!vehiculo || !vehiculo.activo) {
      throw new Error('El vehículo no existe o está inactivo');
    }

    if (vehiculo.estado === 'MANTENIMIENTO') {
      throw new Error('El vehículo está en mantenimiento');
    }

    // 3. Bloquear después la reserva
    const reserva = await ReservaRepository.buscarPorIdTransaccional(
      id,
      options
    );

    if (!reserva) {
      throw new Error('La reserva no existe');
    }

    // 4. Verificar que la reserva siga asociada
    // al mismo vehículo que bloqueamos
    if (Number(reserva.vehiculo_id) !== Number(vehiculo.id)) {
      throw new Error(
        'El vehículo asociado a la reserva ha cambiado'
      );
    }

    // 2. Verificar que esté confirmada
    if (reserva.estado !== 'CONFIRMADA') {
      throw new Error(
        'Solo se pueden crear alquileres desde reservas confirmadas'
      );
    }

    // 3. Verificar que los importes sean válidos
    const precioUnitario = Number(reserva.precio_unitario);
    const total = Number(reserva.total);

    if (
      !Number.isFinite(precioUnitario) ||
      precioUnitario < 0 ||
      !Number.isFinite(total) ||
      total < 0
    ) {
      throw new Error('Los importes de la reserva no son válidos');
    }

    // 4. Crear alquiler con datos históricos
    // La restricción UNIQUE de reserva_id impide duplicados.
    const alquiler = await AlquileresRepository.crear(
      {
        reserva_id: reserva.id,
        usuario_id: reserva.usuario_id,
        vehiculo_id: reserva.vehiculo_id,
        fecha_inicio: reserva.fecha_inicio,
        fecha_fin: reserva.fecha_fin,
        modalidad: reserva.modalidad,
        precio_unitario: precioUnitario,
        tarifa_diaria:
          reserva.modalidad === 'DIA' ? precioUnitario : null,
        monto_total: total,
        estado: 'PENDIENTE'
      },
      { transaction }
    );

    return alquiler;
  });
}
