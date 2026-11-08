import {
  ESTADOS,
  validarNuevaReserva,
  validarVehiculoReservable,
  calcularTotalReserva
} from '../../domain/reservas/Reserva.js';
import { errorValidacion, errorConflicto } from '../../domain/reservas/ReservaError.js';

// Caso de uso: un cliente reserva un vehículo para un intervalo.
// Recibe los repositorios como parámetro (inyección de dependencias) para poder
// probarlo con repositorios en memoria, sin base de datos.
export function construirCrearReserva({ reservaRepo, vehiculoRepo }) {
  return async function crearReserva({ usuarioId, vehiculoId, fechaInicio, fechaFin, modalidad }) {
    // 1. Datos obligatorios y reglas de fechas/modalidad
    if (!usuarioId || !vehiculoId || !fechaInicio || !fechaFin || !modalidad) {
      throw errorValidacion('Faltan campos obligatorios: vehiculoId, fechaInicio, fechaFin y modalidad');
    }
    validarNuevaReserva({ fechaInicio, fechaFin, modalidad });

    // 2. El vehículo debe existir y poder alquilarse
    const vehiculo = await vehiculoRepo.findById(Number(vehiculoId));
    validarVehiculoReservable(vehiculo);

    // 3. Precio: se toma la tarifa vigente y se guarda una "foto" en la reserva
    const precioUnitario = Number(modalidad === 'HORA' ? vehiculo.precio_hora : vehiculo.precio_dia);
    if (!(precioUnitario > 0)) {
      throw errorConflicto('El vehículo no tiene una tarifa configurada para esa modalidad');
    }
    const { total } = calcularTotalReserva({ fechaInicio, fechaFin, modalidad, precioUnitario });

    // 4. Guardar solo si nadie más tiene el auto en ese intervalo
    const reserva = await reservaRepo.crearSiDisponible({
      usuario_id: Number(usuarioId),
      vehiculo_id: vehiculo.id,
      fecha_inicio: new Date(fechaInicio),
      fecha_fin: new Date(fechaFin),
      modalidad,
      precio_unitario: precioUnitario,
      total,
      estado: ESTADOS.RESERVADA
    });

    if (!reserva) {
      throw errorConflicto('El vehículo ya está reservado en ese horario');
    }
    return reserva;
  };
}
