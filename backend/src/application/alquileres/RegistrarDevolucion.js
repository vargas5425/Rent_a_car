
import { sequelize } from '../../infrastructure/models/index.js';

import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import CargoAdicionalRepository from '../../infrastructure/repositories/CargoAdicionalRepository.js';

import { calcularCargoRetraso } from './CalcularCargosDevolucion.js';
import { calcularCargoCombustible } from './CalcularCargoCombustible.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';

export async function registrarDevolucion(alquilerId, datos) {
  const id = Number(alquilerId);

  // Validar datos sin convertir valores vacíos a cero
  const kilometrajeFinal = Number(datos.kilometraje_final);
  const combustibleFinal = Number(datos.combustible_final);
  const requiereMantenimiento = datos.requiere_mantenimiento;
  const observacionesDevolucion = datos.observaciones_devolucion;
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('El ID del alquiler no es válido');
  }

  if (
    datos.kilometraje_final === undefined ||
    datos.kilometraje_final === null ||
    datos.kilometraje_final === '' ||
    !Number.isInteger(kilometrajeFinal) ||
    kilometrajeFinal < 0
  ) {
    throw new Error('El kilometraje final debe ser un entero positivo o cero');
  }

  if (
    datos.combustible_final === undefined ||
    datos.combustible_final === null ||
    datos.combustible_final === '' ||
    !Number.isInteger(combustibleFinal) ||
    combustibleFinal < 0 ||
    combustibleFinal > 100
  ) {
    throw new Error('El combustible final debe estar entre 0 y 100');
  }

  if (typeof requiereMantenimiento !== 'boolean') {
    throw new Error('Debes indicar si el vehículo requiere mantenimiento');
  }

  if (
  typeof observacionesDevolucion !== 'string' ||
  observacionesDevolucion.trim().length === 0
    ) {
    throw new Error('Debes ingresar las observaciones de devolución');
    }

  // Todos los cambios se ejecutan en una transacción
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

    if (!vehiculo) {
      throw new Error('El vehículo asociado no existe');
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
      Number(alquiler.vehiculo_id) !==
      Number(vehiculo.id)
    ) {
      throw new Error(
        'Los datos del alquiler no coinciden con el vehículo'
      );
    }

    // Comprobar que la asociación siga siendo la misma
    if (Number(alquiler.reserva_id) !== Number(reserva.id)) {
      throw new Error('Los datos del alquiler no coinciden con la reserva');
    }

    // 4. Validar el estado del alquiler
    if (alquiler.estado !== 'ACTIVO') {
      throw new Error('Solo se pueden devolver alquileres activos');
    }

    // 5. Validar el estado de la reserva
    if (reserva.estado !== 'ENTREGADA') {
      throw new Error(
        'La reserva debe estar entregada para registrar la devolución'
      );
    }

    // 6. Verificar que los datos coincidan
    if (
      Number(reserva.usuario_id) !== Number(alquiler.usuario_id) ||
      Number(reserva.vehiculo_id) !== Number(alquiler.vehiculo_id)
    ) {
      throw new Error(
        'Los datos del alquiler no coinciden con la reserva'
      );
    }

    // 7. Verificar que exista una entrega registrada
    if (!alquiler.fecha_entrega) {
      throw new Error(
        'No se puede devolver un vehículo que no fue entregado'
      );
    }

    // 8. Evitar devoluciones duplicadas
    if (alquiler.fecha_devolucion) {
      throw new Error(
        'Este alquiler ya tiene una devolución registrada'
      );
    }

    // 9. Validar kilometraje final
    if (kilometrajeFinal < Number(alquiler.kilometraje_inicial)) {
      throw new Error(
        'El kilometraje final no puede ser menor al inicial'
      );
    }

    // 2. Buscar y validar el vehículo

    if (vehiculo.estado !== 'ALQUILADA') {
      throw new Error('El vehículo no se encuentra en estado ALQUILADA');
    }

    const fechaDevolucion = new Date();

    // Validar la fecha de devolución respecto a la entrega
    const fechaEntrega = new Date(alquiler.fecha_entrega);

    if (!Number.isFinite(fechaEntrega.getTime())) {
    throw new Error('La fecha de entrega registrada no es válida');
    }

    if (fechaDevolucion < fechaEntrega) {
    throw new Error(
        'La fecha de devolución no puede ser anterior a la fecha de entrega'
    );
    }

    // 3. Calcular cargo por retraso
    
    const calculoRetraso = calcularCargoRetraso({
        fecha_fin: alquiler.fecha_fin,
        fecha_devolucion: fechaDevolucion,
        modalidad: alquiler.modalidad,
        precio_unitario: alquiler.precio_unitario,
        tarifa_diaria: alquiler.tarifa_diaria
    });


    const cargosGenerados = [];

    // Calcular cargo por combustible faltante
    const calculoCombustible = calcularCargoCombustible({
    combustible_inicial: alquiler.combustible_inicial,
    combustible_final: combustibleFinal
    });

    // 4. Registrar cargo únicamente si existe retraso
    if (calculoRetraso.monto > 0) {
      const cargo = await CargoAdicionalRepository.crear(
        {
          alquiler_id: id,
          tipo: 'RETRASO',
          descripcion:
            `Cargo automático por ${calculoRetraso.horas_retraso} hora(s) de retraso`,
          monto: calculoRetraso.monto,
          fecha_cargo: fechaDevolucion
        },
        { transaction }
      );

      cargosGenerados.push(cargo);
    }

    // Registrar cargo automático por combustible faltante
    if (calculoCombustible.monto > 0) {
    const cargoCombustible = await CargoAdicionalRepository.crear(
        {
        alquiler_id: id,
        tipo: 'COMBUSTIBLE',
        descripcion:
            `Cargo automático por ${calculoCombustible.combustible_faltante} puntos porcentuales de combustible faltante`,
        monto: calculoCombustible.monto,
        fecha_cargo: fechaDevolucion
        },
        { transaction }
    );

    cargosGenerados.push(cargoCombustible);
    }

    // 5. Registrar devolución y finalizar alquiler
    const alquilerActualizado =
    await AlquileresRepository.registrarDevolucion(
        id,
        {
        fecha_devolucion: fechaDevolucion,
        kilometraje_final: kilometrajeFinal,
        combustible_final: combustibleFinal,
        observaciones_devolucion: observacionesDevolucion.trim()
        },
        { transaction }
    );

    // 6. Actualizar estado y kilometraje del vehículo
    
    // 6. Verificar si existe otro alquiler activo
    // para el mismo vehículo
    const tieneOtroAlquilerActivo =
      await AlquileresRepository.existeOtroAlquilerActivo(
        alquiler.vehiculo_id,
        id,
        { transaction }
      );

    // Evitar liberar el vehículo si tiene otro alquiler activo
    if (tieneOtroAlquilerActivo) {
      throw new Error(
        'El vehículo tiene otro alquiler activo y no puede liberarse'
      );
    }

    // 7. Determinar el nuevo estado del vehículo
    const nuevoEstadoVehiculo = requiereMantenimiento
      ? 'MANTENIMIENTO'
      : 'DISPONIBLE';

    // 8. Actualizar el estado y kilometraje del vehículo
    await VehiculoRepository.update(
      alquiler.vehiculo_id,
      {
        kilometraje_actual: kilometrajeFinal,
        estado: nuevoEstadoVehiculo
      },
      { transaction }
    );



    // Actualizar el estado de la reserva
    await ReservaRepository.cambiarEstadoTransaccional(
      reserva.id,
      'DEVUELTA',
      { transaction }
    );

    // 7. Calcular el total de cargos existentes
    const totalCargos = await CargoAdicionalRepository.calcularTotal(
      id,
      { transaction }
    );

        
    return {
    mensaje: 'Devolución registrada correctamente',

    alquiler: alquilerActualizado,

    // Información de la reserva actualizada
    reserva: {
        id: reserva.id,
        estado: 'DEVUELTA'
    },

    vehiculo: {
        id: vehiculo.id,
        estado: nuevoEstadoVehiculo,
        kilometraje_actual: kilometrajeFinal
    },

    retraso: calculoRetraso,
    combustible: calculoCombustible,
    cargos_generados: cargosGenerados,
    total_cargos: totalCargos
    };

  });
}
