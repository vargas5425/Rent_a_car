import { ESTADOS, transicionar, cancelar, validarIntervalo } from '../../domain/reservas/Reserva.js';
import { errorNoEncontrada } from '../../domain/reservas/ReservaError.js';

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
    async confirmarReserva(id) {
      const reserva = await reservaRepo.findById(Number(id));
      if (!reserva) throw errorNoEncontrada();

      const nuevoEstado = transicionar(reserva.estado, ESTADOS.CONFIRMADA);
      return await reservaRepo.actualizarEstado(reserva.id, nuevoEstado);
    },

    // Cliente (solo las suyas) o staff. Solo desde RESERVADA o CONFIRMADA.
    // Al pasar a CANCELADA el intervalo deja de bloquear: la disponibilidad se calcula
    // a partir de las reservas bloqueantes, así que no hay nada más que liberar.
    async cancelarReserva(id, usuario) {
      const reserva = await cargarReservaVisible(id, usuario);

      const nuevoEstado = cancelar(reserva.estado);
      return await reservaRepo.actualizarEstado(reserva.id, nuevoEstado);
    },

    // Vehículos que se pueden reservar en [fechaInicio, fechaFin)
    async buscarVehiculosDisponibles({ fechaInicio, fechaFin }) {
      validarIntervalo(fechaInicio, fechaFin);

      const [vehiculos, idsOcupados] = await Promise.all([
        vehiculoRepo.findAll(),
        reservaRepo.idsVehiculosOcupados(new Date(fechaInicio), new Date(fechaFin))
      ]);
      const ocupados = new Set(idsOcupados.map(Number));

      return vehiculos.filter(
        (v) => v.activo !== false && v.estado !== 'MANTENIMIENTO' && !ocupados.has(Number(v.id))
      );
    }
  };
}
