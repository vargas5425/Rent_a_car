import {
  ESTADOS,
  transicionar,
  cancelar,
  validarIntervalo,
  validarVehiculoReservable
} from '../../domain/reservas/Reserva.js';
import { errorNoEncontrada, errorConflicto } from '../../domain/reservas/ReservaError.js';

const ROLES_STAFF = ['EMPLEADO', 'ADMINISTRADOR'];

// Casos de uso para consultar y cambiar de estado las reservas.
// `usuario` es el que viene del token: { id, rol }.
export function construirGestionReservas({ reservaRepo, vehiculoRepo }) {
  const esStaff = (usuario) => ROLES_STAFF.includes(usuario.rol);
  const esDueno = (reserva, usuario) => Number(reserva.usuario_id) === Number(usuario.id);

  // Si la reserva no existe, o es de otro cliente, la respuesta es la misma (404):
  // así un cliente no puede averiguar qué ids de reserva existen.
  async function cargarReservaVisible(id, usuario) {
    const reserva = await reservaRepo.findById(Number(id));
    if (!reserva || (!esStaff(usuario) && !esDueno(reserva, usuario))) {
      throw errorNoEncontrada();
    }
    return reserva;
  }

  return {
    // Cliente: solo las suyas
    async listarMisReservas(usuarioId) {
      return await reservaRepo.findByUsuario(Number(usuarioId));
    },

    // Empleado / Administrador: todas
    async listarTodas() {
      return await reservaRepo.findAll();
    },

    async obtenerReserva(id, usuario) {
      return await cargarReservaVisible(id, usuario);
    },

    // Empleado / Administrador: RESERVADA -> CONFIRMADA
    // Antes de confirmar se REVALIDA: entre que el cliente reservó y el empleado confirma pueden
    // pasar horas o días, y en ese tiempo el auto pudo pasar a MANTENIMIENTO o aparecer otra
    // reserva vigente en el mismo horario. Si algo de eso pasó, no se confirma (409).
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

    // Cliente (solo las suyas) o staff. Solo desde RESERVADA o CONFIRMADA.
    // Al pasar a CANCELADA el intervalo deja de bloquear: la disponibilidad se calcula
    // a partir de las reservas bloqueantes, así que no hay nada más que liberar.
    async cancelarReserva(id, usuario) {
      const reserva = await cargarReservaVisible(id, usuario);

      const nuevoEstado = cancelar(reserva.estado);
      const reservaCancelada = await reservaRepo.actualizarEstado(reserva.id, nuevoEstado);
      return reservaCancelada;
    },

    // Vehículos que se pueden reservar en [fechaInicio, fechaFin).
    // El filtrado (activos, sin mantenimiento, sin reservas que choquen) lo hace la base de datos.
    async buscarVehiculosDisponibles({ fechaInicio, fechaFin }) {
      validarIntervalo(fechaInicio, fechaFin);
      return await vehiculoRepo.findDisponibles(new Date(fechaInicio), new Date(fechaFin));
    }
  };
}