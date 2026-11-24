import {
  ESTADOS,
  transicionar,
  cancelar,
  validarIntervalo,
  validarVehiculoReservable
} from '../../domain/reservas/Reserva.js';
import { errorNoEncontrada, errorConflicto } from '../../domain/reservas/ReservaError.js';

const ROLES_STAFF = ['EMPLEADO', 'ADMINISTRADOR'];

export function construirGestionReservas({ reservaRepo, vehiculoRepo }) {
  const esStaff = (usuario) => ROLES_STAFF.includes(usuario.rol);
  const esDueno = (reserva, usuario) => Number(reserva.usuario_id) === Number(usuario.id);

  async function cargarReservaVisible(id, usuario) {
    const reserva = await reservaRepo.findById(Number(id));
    if (!reserva || (!esStaff(usuario) && !esDueno(reserva, usuario))) {
      throw errorNoEncontrada();
    }
    return reserva;
  }

  return {
    async listarMisReservas(usuarioId) {
      return await reservaRepo.findByUsuario(Number(usuarioId));
    },

    async listarTodas() {
      return await reservaRepo.findAll();
    },

    async obtenerReserva(id, usuario) {
      return await cargarReservaVisible(id, usuario);
    },

    async confirmarReserva(id) {
      const reserva = await reservaRepo.findById(Number(id));
      if (!reserva) throw errorNoEncontrada();

      const nuevoEstado = transicionar(reserva.estado, ESTADOS.CONFIRMADA);

      validarVehiculoReservable(await vehiculoRepo.findById(reserva.vehiculo_id));

      const confirmada = await reservaRepo.actualizarEstadoSiLibre(reserva.id, nuevoEstado);
      if (!confirmada) {
        throw errorConflicto('El vehículo ya no está libre en ese horario; no se puede confirmar la reserva');
      }
      return confirmada;
    },

    async cancelarReserva(id, usuario) {
      const reserva = await cargarReservaVisible(id, usuario);

      const nuevoEstado = cancelar(reserva.estado);
      const reservaCancelada = await reservaRepo.actualizarEstado(reserva.id, nuevoEstado);
      return reservaCancelada;
    },

    async finalizarReserva(id) {
      const reserva = await reservaRepo.findById(Number(id));
      if (!reserva) throw errorNoEncontrada();

      const nuevoEstado = transicionar(reserva.estado, ESTADOS.FINALIZADA);
      return await reservaRepo.actualizarEstado(reserva.id, nuevoEstado);
    },

    async buscarVehiculosDisponibles({ fechaInicio, fechaFin }) {
      validarIntervalo(fechaInicio, fechaFin);
      return await vehiculoRepo.findDisponibles(new Date(fechaInicio), new Date(fechaFin));
    }
  };
}