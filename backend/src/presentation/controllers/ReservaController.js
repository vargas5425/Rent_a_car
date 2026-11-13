import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import { construirCrearReserva } from '../../application/reservas/CrearReserva.js';
import { construirGestionReservas } from '../../application/reservas/GestionReserva.js';

// Aquí se "enchufan" los repositorios reales (MySQL) a los casos de uso.
const dependencias = { reservaRepo: ReservaRepository, vehiculoRepo: VehiculoRepository };
const crearReserva = construirCrearReserva(dependencias);
const gestion = construirGestionReservas(dependencias);

// Los errores de negocio (ReservaError) traen su propio status; el resto es un 500.
function responderError(res, error) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message, codigo: error.codigo });
  }
  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

export async function postReserva(req, res) {
  try {
    const { vehiculoId, fechaInicio, fechaFin, modalidad } = req.body;
    const reserva = await crearReserva({
      usuarioId: req.usuario.id,
      vehiculoId,
      fechaInicio,
      fechaFin,
      modalidad
    });
    res.status(201).json({ mensaje: 'Reserva creada exitosamente', reserva });
  } catch (error) {
    responderError(res, error);
  }
}

export async function getMisReservas(req, res) {
  try {
    res.status(200).json(await gestion.listarMisReservas(req.usuario.id));
  } catch (error) {
    responderError(res, error);
  }
}

export async function getReservas(req, res) {
  try {
    res.status(200).json(await gestion.listarTodas());
  } catch (error) {
    responderError(res, error);
  }
}

export async function getReserva(req, res) {
  try {
    res.status(200).json(await gestion.obtenerReserva(req.params.id, req.usuario));
  } catch (error) {
    responderError(res, error);
  }
}

export async function patchConfirmarReserva(req, res) {
  try {
    const reserva = await gestion.confirmarReserva(req.params.id);
    res.status(200).json({ mensaje: 'Reserva confirmada', reserva });
  } catch (error) {
    responderError(res, error);
  }
}

export async function patchCancelarReserva(req, res) {
  try {
    const reserva = await gestion.cancelarReserva(req.params.id, req.usuario);
    res.status(200).json({ mensaje: 'Reserva cancelada', reserva });
  } catch (error) {
    responderError(res, error);
  }
}


export async function patchFinalizarReserva(req, res) {
  try {
    const reserva = await gestion.finalizarReserva(req.params.id);

    return res.status(200).json({
      mensaje: 'Reserva finalizada correctamente',
      reserva
    });

  } catch (error) {
    return responderError(res, error);
  }
}


export async function getDisponibilidad(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const vehiculos = await gestion.buscarVehiculosDisponibles({ fechaInicio, fechaFin });
    res.status(200).json(vehiculos);
  } catch (error) {
    responderError(res, error);
  }
}