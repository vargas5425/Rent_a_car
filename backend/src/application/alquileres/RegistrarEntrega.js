
import { sequelize } from '../../infrastructure/models/index.js';

import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';

export async function registrarEntrega(alquilerId, datos) {
  const id = Number(alquilerId);
  const kilometraje = Number(datos.kilometraje_inicial);
  const combustible = Number(datos.combustible_inicial);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('El ID del alquiler no es válido');
  }

  if (
    datos.kilometraje_inicial === undefined ||
    datos.kilometraje_inicial === null ||
    datos.kilometraje_inicial === '' ||
    !Number.isInteger(kilometraje) ||
    kilometraje < 0
  ) {
    throw new Error(
      'El kilometraje inicial debe ser un entero positivo o cero'
    );
  }

  if (
    datos.combustible_inicial === undefined ||
    datos.combustible_inicial === null ||
    datos.combustible_inicial === '' ||
    !Number.isInteger(combustible) ||
    combustible < 0 ||
    combustible > 100
  ) {
    throw new Error(
      'El combustible inicial debe estar entre 0 y 100'
    );
  }

  return await sequelize.transaction(async (transaction) => {
    const options = {
      transaction,
      lock: transaction.LOCK.UPDATE
    };

    
    
    // 1. Consultar el alquiler sin bloquear
    // para identificar el vehículo y la reserva
    const alquilerInicial = await AlquileresRepository.buscarPorId(
      id,
      { transaction }
    );

    if (!alquilerInicial) {
      throw new Error('El alquiler no existe');
    }

    if (!alquilerInicial.reserva_id) {
      throw new Error('El alquiler no tiene una reserva asociada');
    }

    // 2. Bloquear primero el vehículo
    const vehiculo = await VehiculoRepository.findById(
      alquilerInicial.vehiculo_id,
      options
    );

    if (!vehiculo || !vehiculo.activo) {
      throw new Error('El vehículo no existe o está inactivo');
    }

    // 3. Bloquear después la reserva
    const reserva = await ReservaRepository.buscarPorIdTransaccional(
      alquilerInicial.reserva_id,
      options
    );

    if (!reserva) {
      throw new Error('La reserva asociada no existe');
    }

    // 4. Bloquear finalmente el alquiler
    const alquiler = await AlquileresRepository.buscarPorId(
      id,
      options
    );

    if (!alquiler) {
      throw new Error('El alquiler no existe');
    }

    // Verificar que el alquiler no haya cambiado de vehículo
    if (
      Number(alquiler.vehiculo_id) !== Number(vehiculo.id)
    ) {
      throw new Error(
        'Los datos del alquiler no coinciden con el vehículo'
      );
    }

    // Comprobar que la asociación no haya cambiado
    if (Number(alquiler.reserva_id) !== Number(reserva.id)) {
      throw new Error('Los datos del alquiler no coinciden con la reserva');
    }

    // 4. Validar estado del alquiler
    if (alquiler.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden entregar alquileres pendientes');
    }

    if (alquiler.fecha_entrega) {
      throw new Error('Este alquiler ya tiene una entrega registrada');
    }

    // 5. Validar estado de la reserva
    if (reserva.estado !== 'CONFIRMADA') {
      throw new Error(
        'La reserva debe estar confirmada para entregar el vehículo'
      );
    }

    // 6. Validar que los datos coincidan
    if (
      Number(reserva.usuario_id) !== Number(alquiler.usuario_id) ||
      Number(reserva.vehiculo_id) !== Number(alquiler.vehiculo_id)
    ) {
      throw new Error(
        'Los datos del alquiler no coinciden con la reserva'
      );
    }

    // Validar que la entrega no sea anterior al inicio de la reserva
    const fechaActual = new Date();
    const fechaInicio = new Date(reserva.fecha_inicio);

    if (fechaActual < fechaInicio) {
      throw new Error(
        'No se puede entregar el vehículo antes de la fecha de inicio de la reserva'
      );
    }
    
    // Validar que el vehículo esté disponible para su entrega
    if (vehiculo.estado !== 'DISPONIBLE') {
      throw new Error(
        'El vehículo no está disponible para realizar la entrega'
      );
    }
    // Verificar que no exista otro alquiler activo
    // para el mismo vehículo
    const existeOtroActivo =
      await AlquileresRepository.existeOtroAlquilerActivo(
        alquiler.vehiculo_id,
        alquiler.id,
        { transaction }
      );

    if (existeOtroActivo) {
      throw new Error(
        'El vehículo ya tiene otro alquiler activo'
      );
    }


    if (kilometraje < Number(vehiculo.kilometraje_actual)) {
      throw new Error(
        'El kilometraje inicial no puede ser menor al kilometraje actual del vehículo'
      );
    }

    // 4. Registrar entrega
    const alquilerActualizado =
      await AlquileresRepository.registrarEntrega(
        id,
        {
          fecha_entrega: new Date(),
          kilometraje_inicial: kilometraje,
          combustible_inicial: combustible
        },
        { transaction }
      );

    // 5. Actualizar estado de la reserva
    await ReservaRepository.cambiarEstadoTransaccional(
      reserva.id,
      'ENTREGADA',
      { transaction }
    );

    // 6. Actualizar vehículo
    await VehiculoRepository.update(
      alquiler.vehiculo_id,
      {
        estado: 'ALQUILADA',
        kilometraje_actual: kilometraje
      },
      { transaction }
    );

    return {
      mensaje: 'Entrega registrada correctamente',
      alquiler: alquilerActualizado,
      reserva: {
        id: reserva.id,
        estado: 'ENTREGADA'
      },
      vehiculo: {
        id: vehiculo.id,
        estado: 'ALQUILADA'
      }
    };
  });
}
