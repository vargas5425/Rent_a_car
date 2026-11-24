
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import { construirCrearReserva } from '../../application/reservas/CrearReserva.js';
import { construirGestionReservas } from '../../application/reservas/GestionReserva.js';

// Inyección de dependencias
const dependencias = {
  reservaRepo: ReservaRepository,
  vehiculoRepo: VehiculoRepository
};

const crearReserva = construirCrearReserva(dependencias);
const gestion = construirGestionReservas(dependencias);

// Manejo de errores
function responderError(res, error) {
  if (error.status) {
    return res.status(error.status).json({
      error: error.message,
      codigo: error.codigo
    });
  }

  console.error(error);

  return res.status(500).json({
    error: 'Error interno del servidor'
  });
}

// Crear una reserva
export async function postReserva(req, res) {
  try {
    const {
      vehiculoId,
      fechaInicio,
      fechaFin,
      modalidad
    } = req.body;

    const reserva = await crearReserva({
      usuarioId: req.usuario.id,
      vehiculoId,
      fechaInicio,
      fechaFin,
      modalidad
    });

    return res.status(201).json({
      mensaje: 'Reserva creada exitosamente',
      reserva
    });

  } catch (error) {
    return responderError(res, error);
  }
}

// Consultar reservas del cliente autenticado
export async function getMisReservas(req, res) {
  try {
    return res.status(200).json(
      await gestion.listarMisReservas(req.usuario.id)
    );
  } catch (error) {
    return responderError(res, error);
  }
}

// Consultar todas las reservas
export async function getReservas(req, res) {
  try {
    return res.status(200).json(
      await gestion.listarTodas()
    );
  } catch (error) {
    return responderError(res, error);
  }
}

// Consultar una reserva específica
export async function getReserva(req, res) {
  try {
    return res.status(200).json(
      await gestion.obtenerReserva(
        req.params.id,
        req.usuario
      )
    );
  } catch (error) {
    return responderError(res, error);
  }
}

// Confirmar reserva y registrar historial
export async function patchConfirmarReserva(req, res) {
  try {
    if (!req.usuario?.id) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    const reserva = await gestion.confirmarReserva(
      req.params.id,
      req.usuario
    );

    return res.status(200).json({
      mensaje: 'Reserva confirmada',
      reserva
    });

  } catch (error) {
    return responderError(res, error);
  }
}

// Cancelar reserva y registrar historial
export async function patchCancelarReserva(req, res) {
  try {
    const reserva = await gestion.cancelarReserva(
      req.params.id,
      req.usuario
    );

    return res.status(200).json({
      mensaje: 'Reserva cancelada',
      reserva
    });

  } catch (error) {
    return responderError(res, error);
  }
}

// Finalizar reserva y registrar historial
export async function patchFinalizarReserva(req, res) {
  try {
    if (!req.usuario?.id) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    const reserva = await gestion.finalizarReserva(
      req.params.id,
      req.usuario
    );

    return res.status(200).json({
      mensaje: 'Reserva finalizada correctamente',
      reserva
    });

  } catch (error) {
    return responderError(res, error);
  }
}

// Consultar disponibilidad de vehículos
export async function getDisponibilidad(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const vehiculos =
      await gestion.buscarVehiculosDisponibles({
        fechaInicio,
        fechaFin
      });

    return res.status(200).json(vehiculos);

  } catch (error) {
    return responderError(res, error);
  }
}
