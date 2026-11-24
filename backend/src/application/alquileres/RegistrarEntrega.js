import { sequelize } from '../../infrastructure/models/index.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import { errorValidacion, errorNoEncontrada, errorConflicto } from '../../domain/reservas/ReservaError.js';

export async function registrarEntrega(alquilerId, datos = {}, usuarioResponsable = null) {
  const id = Number(alquilerId);
  const kilometraje = Number(datos.kilometraje_inicial);
  const combustible = Number(datos.combustible_inicial);
  const observacionesEntrega =
    typeof datos.observaciones_entrega === 'string'
      ? datos.observaciones_entrega.trim()
      : '';

  // 👇 NUEVO: depósito/garantía opcional (default 0)
  const depositoRaw = datos.deposito_garantia;
  let deposito = 0;
  if (depositoRaw !== undefined && depositoRaw !== null && depositoRaw !== '') {
    deposito = Number(depositoRaw);
    if (!Number.isFinite(deposito) || deposito < 0) {
      throw errorValidacion('El depósito/garantía debe ser un número positivo o cero');
    }
    // Validar máximo 2 decimales
    if (Math.abs(deposito * 100 - Math.round(deposito * 100)) > 1e-7) {
      throw errorValidacion('El depósito/garantía debe tener máximo dos decimales');
    }
  }

  if (!Number.isInteger(id) || id <= 0) throw errorValidacion('El ID del alquiler no es válido');
  if (datos.kilometraje_inicial === undefined || datos.kilometraje_inicial === null || datos.kilometraje_inicial === '' || !Number.isInteger(kilometraje) || kilometraje < 0) {
    throw errorValidacion('El kilometraje inicial debe ser un entero positivo o cero');
  }
  if (datos.combustible_inicial === undefined || datos.combustible_inicial === null || datos.combustible_inicial === '' || !Number.isInteger(combustible) || combustible < 0 || combustible > 100) {
    throw errorValidacion('El combustible inicial debe estar entre 0 y 100');
  }

  return await sequelize.transaction(async (transaction) => {
    const options = { transaction, lock: transaction.LOCK.UPDATE };

    const alquilerInicial = await AlquileresRepository.buscarPorId(id, { transaction });
    if (!alquilerInicial) throw errorNoEncontrada('El alquiler no existe');
    if (!alquilerInicial.reserva_id) throw errorConflicto('El alquiler no tiene una reserva asociada');

    const vehiculo = await VehiculoRepository.findById(alquilerInicial.vehiculo_id, options);
    if (!vehiculo || !vehiculo.activo) throw errorNoEncontrada('El vehículo no existe o está inactivo');

    const reserva = await ReservaRepository.buscarPorIdTransaccional(alquilerInicial.reserva_id, options);
    if (!reserva) throw errorNoEncontrada('La reserva asociada no existe');

    const alquiler = await AlquileresRepository.buscarPorId(id, options);
    if (!alquiler) throw errorNoEncontrada('El alquiler no existe');

    if (Number(alquiler.vehiculo_id) !== Number(vehiculo.id)) throw errorConflicto('Los datos del alquiler no coinciden con el vehículo');
    if (Number(alquiler.reserva_id) !== Number(reserva.id)) throw errorConflicto('Los datos del alquiler no coinciden con la reserva');
    if (alquiler.estado !== 'PENDIENTE') throw errorConflicto('Solo se pueden entregar alquileres pendientes');
    if (alquiler.fecha_entrega) throw errorConflicto('Este alquiler ya tiene una entrega registrada');

    const estadoReserva = String(reserva.estado || '').toUpperCase();
    if (estadoReserva !== 'CONFIRMADA') throw errorConflicto('La reserva debe estar confirmada para entregar el vehículo');

    if (Number(reserva.usuario_id) !== Number(alquiler.usuario_id) || Number(reserva.vehiculo_id) !== Number(alquiler.vehiculo_id)) {
      throw errorConflicto('Los datos del alquiler no coinciden con la reserva');
    }

    const fechaActual = new Date();
    if (fechaActual < new Date(reserva.fecha_inicio)) {
      throw errorConflicto('No se puede entregar el vehículo antes de la fecha de inicio de la reserva');
    }

    const estadoVehiculo = String(vehiculo.estado || '').toUpperCase();
    const estadosPermitidosEntrega = ['DISPONIBLE', 'RESERVADO', 'RESERVADA'];
    if (!estadosPermitidosEntrega.includes(estadoVehiculo)) {
      throw errorConflicto('El vehículo no está disponible para realizar la entrega');
    }

    const existeOtroActivo = await AlquileresRepository.existeOtroAlquilerActivo(alquiler.vehiculo_id, alquiler.id, { transaction });
    if (existeOtroActivo) throw errorConflicto('El vehículo ya tiene otro alquiler activo');
    if (kilometraje < Number(vehiculo.kilometraje_actual)) throw errorValidacion('El kilometraje inicial no puede ser menor al actual');

    const payloadEntrega = {
      fecha_entrega: new Date(),
      kilometraje_inicial: kilometraje,
      combustible_inicial: combustible,
      observaciones_entrega: observacionesEntrega || null,
      empleado_entrega_id: usuarioResponsable?.id ?? null,
      deposito_garantia: deposito
    };

    const alquilerActualizado = await AlquileresRepository.registrarEntrega(id, payloadEntrega, { transaction });

    await ReservaRepository.cambiarEstadoTransaccional(reserva.id, 'ENTREGADA', { transaction });
    await VehiculoRepository.update(alquiler.vehiculo_id, { estado: 'ALQUILADA', kilometraje_actual: kilometraje }, { transaction });

    return {
      mensaje: 'Entrega registrada correctamente',
      alquiler: alquilerActualizado,
      reserva: { id: reserva.id, estado: 'ENTREGADA' },
      vehiculo: { id: vehiculo.id, estado: 'ALQUILADA' },
      responsable: usuarioResponsable
        ? { id: usuarioResponsable.id, nombre: usuarioResponsable.nombre, rol: usuarioResponsable.rol }
        : null
    };
  });
}