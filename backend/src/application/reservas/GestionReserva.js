
import {
  ESTADOS,
  transicionar,
  cancelar,
  validarIntervalo,
  validarVehiculoReservable
} from '../../domain/reservas/Reserva.js';

import {
  errorNoEncontrada,
  errorConflicto
} from '../../domain/reservas/ReservaError.js';

import { sequelize } from '../../infrastructure/models/index.js';

import RegistrarCambioEstado from '../Historial/RegistrarCambioEstado.js';

const registrarCambioEstado = new RegistrarCambioEstado();

const ROLES_STAFF = ['EMPLEADO', 'ADMINISTRADOR'];

export function construirGestionReservas({
  reservaRepo,
  vehiculoRepo
}) {

  const esStaff = (usuario) =>
    ROLES_STAFF.includes(usuario.rol);

  const esDueno = (reserva, usuario) =>
    Number(reserva.usuario_id) === Number(usuario.id);

  // Verificar acceso a una reserva
  async function cargarReservaVisible(id, usuario) {
    const reserva = await reservaRepo.findById(Number(id));

    if (
      !reserva ||
      (!esStaff(usuario) && !esDueno(reserva, usuario))
    ) {
      throw errorNoEncontrada();
    }

    return reserva;
  }

  return {

    // ==================================================
    // 1. LISTAR RESERVAS DEL CLIENTE
    // ==================================================

    async listarMisReservas(usuarioId) {
      return await reservaRepo.findByUsuario(
        Number(usuarioId)
      );
    },

    // ==================================================
    // 2. LISTAR TODAS LAS RESERVAS
    // ==================================================

    async listarTodas() {
      return await reservaRepo.findAll();
    },

    // ==================================================
    // 3. OBTENER RESERVA POR ID
    // ==================================================

    async obtenerReserva(id, usuario) {
      return await cargarReservaVisible(id, usuario);
    },

    // ==================================================
    // 4. CONFIRMAR RESERVA
    // RESERVADA -> CONFIRMADA
    // ==================================================

    async confirmarReserva(id, usuario) {
      const reserva = await reservaRepo.findById(
        Number(id)
      );

      if (!reserva) {
        throw errorNoEncontrada();
      }

      // Validar transición
      const nuevoEstado = transicionar(
        reserva.estado,
        ESTADOS.CONFIRMADA
      );

      // Validar disponibilidad del vehículo
      validarVehiculoReservable(
        await vehiculoRepo.findById(reserva.vehiculo_id)
      );

      // Confirmar reserva y registrar historial
      const confirmada =
        await reservaRepo.actualizarEstadoSiLibre(
          reserva.id,
          nuevoEstado,
          usuario.id
        );

      if (!confirmada) {
        throw errorConflicto(
          'El vehículo ya no está libre en ese horario; no se puede confirmar la reserva'
        );
      }

      return confirmada;
    },

    // ==================================================
    // 5. CANCELAR RESERVA
    // RESERVADA / CONFIRMADA -> CANCELADA
    // ==================================================

    async cancelarReserva(id, usuario) {
      const reservaId = Number(id);

      if (
        !Number.isSafeInteger(reservaId) ||
        reservaId <= 0
      ) {
        throw errorNoEncontrada();
      }

      return await sequelize.transaction(
        async (transaction) => {

          const options = {
            transaction,
            lock: transaction.LOCK.UPDATE
          };

          // 1. Consultar reserva sin bloquear
          const reservaInicial =
            await reservaRepo.buscarPorIdTransaccional(
              reservaId,
              { transaction }
            );

          if (!reservaInicial) {
            throw errorNoEncontrada();
          }

          // 2. Bloquear primero el vehículo
          const vehiculo = await vehiculoRepo.findById(
            reservaInicial.vehiculo_id,
            options
          );

          if (!vehiculo) {
            throw errorNoEncontrada();
          }

          // 3. Bloquear después la reserva
          const reserva =
            await reservaRepo.buscarPorIdTransaccional(
              reservaId,
              options
            );

          if (!reserva) {
            throw errorNoEncontrada();
          }

          // 4. Verificar asociación del vehículo
          if (
            Number(reserva.vehiculo_id) !==
            Number(vehiculo.id)
          ) {
            throw errorConflicto(
              'La reserva cambió de vehículo durante la operación'
            );
          }

          // 5. Verificar permisos del usuario
          if (
            !esStaff(usuario) &&
            !esDueno(reserva, usuario)
          ) {
            throw errorNoEncontrada();
          }

          // 6. Validar cancelación
          const nuevoEstado = cancelar(reserva.estado);

          // 7. Guardar estado anterior
          const estadoAnterior = reserva.estado;

          // 8. Actualizar estado
          const reservaCancelada =
            await reservaRepo.cambiarEstadoTransaccional(
              reserva.id,
              nuevoEstado,
              { transaction }
            );

          // 9. Registrar historial de cancelación
          await registrarCambioEstado.ejecutar({
            tipoEntidad: 'RESERVA',
            entidadId: reserva.id,
            estadoAnterior,
            estadoNuevo: nuevoEstado,
            usuarioId: usuario.id,
            observacion: `Reserva cancelada por ${usuario.rol}`,
            transaction
          });

          return reservaCancelada;
        }
      );
    },

    // ==================================================
    // 6. FINALIZAR RESERVA
    // DEVUELTA -> FINALIZADA
    // ==================================================

    async finalizarReserva(id, usuario) {
      const reservaId = Number(id);

      if (
        !Number.isSafeInteger(reservaId) ||
        reservaId <= 0
      ) {
        throw errorNoEncontrada();
      }

      return await sequelize.transaction(
        async (transaction) => {

          const options = {
            transaction,
            lock: transaction.LOCK.UPDATE
          };

          // 1. Buscar y bloquear reserva
          const reserva =
            await reservaRepo.buscarPorIdTransaccional(
              reservaId,
              options
            );

          if (!reserva) {
            throw errorNoEncontrada();
          }

          // 2. Validar transición
          const nuevoEstado = transicionar(
            reserva.estado,
            ESTADOS.FINALIZADA
          );

          // 3. Guardar estado anterior
          const estadoAnterior = reserva.estado;

          // 4. Actualizar estado
          const reservaFinalizada =
            await reservaRepo.cambiarEstadoTransaccional(
              reserva.id,
              nuevoEstado,
              { transaction }
            );

          // 5. Registrar historial de finalización
          await registrarCambioEstado.ejecutar({
            tipoEntidad: 'RESERVA',
            entidadId: reserva.id,
            estadoAnterior,
            estadoNuevo: nuevoEstado,
            usuarioId: usuario.id,
            observacion: 'Cierre administrativo de la reserva',
            transaction
          });

          return reservaFinalizada;
        }
      );
    },

    // ==================================================
    // 7. BUSCAR VEHÍCULOS DISPONIBLES
    // ==================================================

    async buscarVehiculosDisponibles({
      fechaInicio,
      fechaFin
    }) {

      validarIntervalo(fechaInicio, fechaFin);

      return await vehiculoRepo.findDisponibles(
        new Date(fechaInicio),
        new Date(fechaFin)
      );
    }
  };
}
