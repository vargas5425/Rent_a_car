import {
  ESTADOS,
  validarNuevaReserva,
  validarVehiculoReservable
} from '../../domain/reservas/Reserva.js';
import { errorValidacion, errorConflicto } from '../../domain/reservas/ReservaError.js';
import { generarSnapshotTarifa } from '../../domain/tarifas/TarifaService.js';
import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';

export function construirCrearReserva({ reservaRepo, vehiculoRepo }) {
  return async function crearReserva({ usuarioId, vehiculoId, fechaInicio, fechaFin, modalidad }) {
    if (!usuarioId || !vehiculoId || !fechaInicio || !fechaFin || !modalidad) {
      throw errorValidacion('Faltan campos obligatorios: vehiculoId, fechaInicio, fechaFin y modalidad');
    }
    validarNuevaReserva({ fechaInicio, fechaFin, modalidad });

    const inicioDate = new Date(fechaInicio);
    const finDate = new Date(fechaFin);
    const horas = (finDate.getTime() - inicioDate.getTime()) / (1000 * 60 * 60);

    if (!Number.isFinite(horas) || horas <= 0) {
      throw errorValidacion('El intervalo de fechas y horas no es válido');
    }

    const vehiculo = await vehiculoRepo.findById(Number(vehiculoId));
    validarVehiculoReservable(vehiculo);

    const snapshot = await generarSnapshotTarifa(vehiculo, horas, modalidad, TarifaRepository);

    const precioUnitario = Number(snapshot.precio_unitario_al_momento);
    const precioTotal = Number(snapshot.precio_total_calculado);

    if (!Number.isFinite(precioUnitario) || precioUnitario < 0 || !Number.isFinite(precioTotal) || precioTotal < 0) {
      throw errorValidacion('El cálculo de tarifa no puede generar montos negativos');
    }

    const reserva = await reservaRepo.crearSiDisponible({
      usuario_id: Number(usuarioId),
      vehiculo_id: vehiculo.id,
      fecha_inicio: inicioDate,
      fecha_fin: finDate,
      modalidad,
      precio_unitario: precioUnitario,
      total: precioTotal,
      estado: ESTADOS.RESERVADA
    });

    if (!reserva) {
      throw errorConflicto('El vehículo ya está reservado en ese horario');
    }

    await vehiculoRepo.update(vehiculo.id, { estado: 'RESERVADA' });
    return reserva;
  };
}