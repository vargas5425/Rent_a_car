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

    const vehiculo = await vehiculoRepo.findById(Number(vehiculoId));
    validarVehiculoReservable(vehiculo);

    // 1. Calcular la duración en horas
    const horas = (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60);

    // 2. Usar el TarifaService para calcular el precio (Prioridad: Vehículo > Categoría)
    const snapshot = await generarSnapshotTarifa(vehiculo, horas, modalidad, TarifaRepository);

    // 3. Crear la reserva con el total calculado
    const reserva = await reservaRepo.crearSiDisponible({
      usuario_id: Number(usuarioId),
      vehiculo_id: vehiculo.id,
      fecha_inicio: new Date(fechaInicio),
      fecha_fin: new Date(fechaFin),
      modalidad,
      precio_unitario: snapshot.precio_unitario_al_momento,
      total: snapshot.precio_total_calculado,
      estado: ESTADOS.RESERVADA
    });

    if (!reserva) {
      throw errorConflicto('El vehículo ya está reservado en ese horario');
    }

    await vehiculoRepo.update(vehiculo.id, { estado: 'RESERVADA' });
    return reserva;
  };
}