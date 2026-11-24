import { sequelize } from '../../infrastructure/models/index.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import CargoAdicionalRepository from '../../infrastructure/repositories/CargoAdicionalRepository.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import { calcularCargoRetraso, calcularCargoCombustible } from '../../domain/tarifas/TarifaService.js';
import { errorValidacion, errorNoEncontrada, errorConflicto } from '../../domain/reservas/ReservaError.js';

export async function registrarDevolucion(alquilerId, datos) {
  const id = Number(alquilerId);
  const kilometrajeFinal = Number(datos.kilometraje_final);
  const combustibleFinal = Number(datos.combustible_final);
  const requiereMantenimiento = datos.requiere_mantenimiento;
  const observacionesDevolucion = datos.observaciones_devolucion;
  
  // 👇 NUEVO: Recibimos los cargos manuales desde el frontend (daños, limpieza, etc.)
  const cargosManuales = Array.isArray(datos.cargos_manuales) ? datos.cargos_manuales : [];

  if (!Number.isInteger(id) || id <= 0) throw errorValidacion('El ID del alquiler no es válido');
  if (datos.kilometraje_final === undefined || datos.kilometraje_final === null || datos.kilometraje_final === '' || !Number.isInteger(kilometrajeFinal) || kilometrajeFinal < 0) {
    throw errorValidacion('El kilometraje final debe ser un entero positivo o cero');
  }
  if (datos.combustible_final === undefined || datos.combustible_final === null || datos.combustible_final === '' || !Number.isInteger(combustibleFinal) || combustibleFinal < 0 || combustibleFinal > 100) {
    throw errorValidacion('El combustible final debe estar entre 0 y 100');
  }
  if (typeof requiereMantenimiento !== 'boolean') throw errorValidacion('Debes indicar si el vehículo requiere mantenimiento');
  if (typeof observacionesDevolucion !== 'string' || observacionesDevolucion.trim().length === 0) {
    throw errorValidacion('Debes ingresar las observaciones de devolución');
  }

  return await sequelize.transaction(async (transaction) => {
    const options = { transaction, lock: transaction.LOCK.UPDATE };

    const alquilerInicial = await AlquileresRepository.buscarPorId(id, { transaction });
    if (!alquilerInicial) throw errorNoEncontrada('El alquiler no existe');
    if (!alquilerInicial.reserva_id) throw errorConflicto('El alquiler no tiene una reserva asociada');

    const vehiculo = await VehiculoRepository.findById(alquilerInicial.vehiculo_id, options);
    if (!vehiculo) throw errorNoEncontrada('El vehículo asociado no existe');

    const reserva = await ReservaRepository.buscarPorIdTransaccional(alquilerInicial.reserva_id, options);
    if (!reserva) throw errorNoEncontrada('La reserva asociada no existe');

    const alquiler = await AlquileresRepository.buscarPorId(id, options);
    if (!alquiler) throw errorNoEncontrada('El alquiler no existe');

    if (Number(alquiler.vehiculo_id) !== Number(vehiculo.id)) throw errorConflicto('Los datos del alquiler no coinciden con el vehículo');
    if (Number(alquiler.reserva_id) !== Number(reserva.id)) throw errorConflicto('Los datos del alquiler no coinciden con la reserva');
    if (alquiler.estado !== 'ACTIVO') throw errorConflicto('Solo se pueden devolver alquileres activos');
    if (reserva.estado !== 'ENTREGADA') throw errorConflicto('La reserva debe estar entregada para registrar la devolución');

    if (Number(reserva.usuario_id) !== Number(alquiler.usuario_id) || Number(reserva.vehiculo_id) !== Number(alquiler.vehiculo_id)) {
      throw errorConflicto('Los datos del alquiler no coinciden con la reserva');
    }
    if (!alquiler.fecha_entrega) throw errorConflicto('No se puede devolver un vehículo que no fue entregado');
    if (alquiler.fecha_devolucion) throw errorConflicto('Este alquiler ya tiene una devolución registrada');
    if (kilometrajeFinal < Number(alquiler.kilometraje_inicial)) throw errorValidacion('El kilometraje final no puede ser menor al inicial');
    if (vehiculo.estado !== 'ALQUILADA') throw errorConflicto('El vehículo no se encuentra en estado ALQUILADA');

    const fechaDevolucion = new Date();
    const fechaEntrega = new Date(alquiler.fecha_entrega);
    if (fechaDevolucion < fechaEntrega) throw errorValidacion('La fecha de devolución no puede ser anterior a la fecha de entrega');

    // Cálculos automáticos
    const calculoRetraso = calcularCargoRetraso({
      fecha_fin: alquiler.fecha_fin,
      fecha_devolucion: fechaDevolucion,
      modalidad: alquiler.modalidad,
      precio_unitario: alquiler.precio_unitario,
      tarifa_diaria: alquiler.tarifa_diaria
    });

    const calculoCombustible = calcularCargoCombustible({
      combustible_inicial: alquiler.combustible_inicial,
      combustible_final: combustibleFinal
    });

    const cargosGenerados = [];

    // 1. Cargo por retraso
    if (calculoRetraso.monto > 0) {
      const cargo = await CargoAdicionalRepository.crear({
        alquiler_id: id,
        tipo: 'RETRASO',
        descripcion: `Cargo automático por ${calculoRetraso.horas_retraso} hora(s) de retraso`,
        monto: calculoRetraso.monto,
        fecha_cargo: fechaDevolucion
      }, { transaction });
      cargosGenerados.push(cargo);
    }

    // 2. Cargo por combustible
    if (calculoCombustible.monto > 0) {
      const cargoCombustible = await CargoAdicionalRepository.crear({
        alquiler_id: id,
        tipo: 'COMBUSTIBLE',
        descripcion: `Cargo automático por ${calculoCombustible.combustible_faltante} puntos porcentuales de combustible faltante`,
        monto: calculoCombustible.monto,
        fecha_cargo: fechaDevolucion
      }, { transaction });
      cargosGenerados.push(cargoCombustible);
    }

    // 3. 👇 NUEVO: Procesar cargos manuales (daños, limpieza, etc.) que envía el empleado
    for (const cargoManual of cargosManuales) {
      const monto = Number(cargoManual.monto);
      if (!Number.isFinite(monto) || monto <= 0) continue; // Ignorar cargos inválidos o en 0
      
      const cargoManualCreado = await CargoAdicionalRepository.crear({
        alquiler_id: id,
        tipo: cargoManual.tipo || 'OTRO',
        descripcion: cargoManual.descripcion || 'Cargo adicional',
        monto: monto,
        fecha_cargo: fechaDevolucion
      }, { transaction });
      cargosGenerados.push(cargoManualCreado);
    }

    // Actualizar monto_total base
    const montoBase = Number(alquiler.monto_total || 0);
    const totalCargosNuevos = cargosGenerados.reduce((suma, cargo) => suma + Number(cargo.monto || 0), 0);
    const nuevoMontoTotal = Math.round((montoBase + totalCargosNuevos) * 100) / 100;

    const alquilerActualizado = await AlquileresRepository.registrarDevolucion(id, {
      fecha_devolucion: fechaDevolucion,
      kilometraje_final: kilometrajeFinal,
      combustible_final: combustibleFinal,
      observaciones_devolucion: observacionesDevolucion.trim()
    }, { transaction });

    if (nuevoMontoTotal !== montoBase) {
      await AlquileresRepository.actualizarMontoTotal(id, nuevoMontoTotal, { transaction });
    }

    const tieneOtroAlquilerActivo = await AlquileresRepository.existeOtroAlquilerActivo(alquiler.vehiculo_id, id, { transaction });
    if (tieneOtroAlquilerActivo) throw errorConflicto('El vehículo tiene otro alquiler activo y no puede liberarse');

    const nuevoEstadoVehiculo = requiereMantenimiento ? 'MANTENIMIENTO' : 'DISPONIBLE';

    await VehiculoRepository.update(alquiler.vehiculo_id, {
      kilometraje_actual: kilometrajeFinal,
      estado: nuevoEstadoVehiculo
    }, { transaction });

    await ReservaRepository.cambiarEstadoTransaccional(reserva.id, 'DEVUELTA', { transaction });

    const totalCargos = await CargoAdicionalRepository.calcularTotal(id, { transaction });
    
    // 👇 Calculamos el total final real (Base + Todos los cargos)
    const totalFinalAbsoluto = Math.round((montoBase + totalCargos) * 100) / 100;

    // 👇 NUEVO: Calculamos el saldo final a pagar restando la garantía (si es mayor a 0)
    const deposito = Number(alquiler.deposito_garantia || 0);
    // Nota: si el depósito es mayor al total, el saldo será 0 (se devuelve el resto al cliente)
    const saldoAPagar = Math.max(0, Math.round((totalFinalAbsoluto - deposito) * 100) / 100);

    return {
      mensaje: 'Devolución registrada correctamente',
      alquiler: { ...alquilerActualizado, monto_total: nuevoMontoTotal },
      reserva: { id: reserva.id, estado: 'DEVUELTA' },
      vehiculo: { id: vehiculo.id, estado: nuevoEstadoVehiculo, kilometraje_actual: kilometrajeFinal },
      retraso: calculoRetraso,
      combustible: calculoCombustible,
      cargos_generados: cargosGenerados, // Aquí van todos, incluyendo los manuales
      total_cargos: totalCargos,
      monto_base: montoBase,
      monto_total_final: totalFinalAbsoluto,
      deposito_garantia: deposito,
      saldo_a_pagar: saldoAPagar // 👈 Este es el monto que realmente debe pagar el cliente
    };
  });
}