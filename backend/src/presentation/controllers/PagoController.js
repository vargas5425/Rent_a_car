
import RegistrarPago from '../../application/pagos/RegistrarPago.js';
import ConsultarSaldoReserva from '../../application/pagos/ConsultarSaldoReserva.js';
import PagosRepository from '../../infrastructure/repositories/PagosRepository.js';
import { Op } from 'sequelize';
import {
  ReservaModel,
  PagoModel
} from '../../infrastructure/models/index.js';

const registrarPagoService = new RegistrarPago();
const consultarSaldoService = new ConsultarSaldoReserva();

export async function registrarPago(req, res) {
  try {
    const {
      reservaId,
      monto,
      metodoPago,
      referencia
    } = req.body;

    const resultado = await registrarPagoService.ejecutar({
      reservaId,
      monto,
      metodoPago,
      referencia
    });

    return res.status(201).json({
      mensaje: 'Pago registrado correctamente',
      ...resultado
    });

  } catch (error) {
    console.error('Error al registrar pago:', error);

    const mensajesValidacion = [
      'La reserva indicada no es válida',
      'Método de pago no válido',
      'El monto del pago debe ser mayor a cero',
      'El monto del pago supera el saldo pendiente de la reserva',
      'El monto debe ser un número válido y no negativo'
    ];

    if (mensajesValidacion.includes(error.message)) {
      return res.status(400).json({
        error: error.message
      });
    }

    if (error.message === 'Reserva no encontrada') {
      return res.status(404).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: 'No se pudo registrar el pago'
    });
  }
}

export async function consultarSaldo(req, res) {
  try {
    const { reservaId } = req.params;

    const resultado = await consultarSaldoService.ejecutar(
      reservaId
    );

    return res.status(200).json({
      mensaje: 'Saldo consultado correctamente',
      ...resultado
    });

  } catch (error) {
    console.error('Error al consultar saldo:', error);

    if (error.message === 'La reserva indicada no es válida') {
      return res.status(400).json({
        error: error.message
      });
    }

    if (error.message === 'Reserva no encontrada') {
      return res.status(404).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: 'No se pudo consultar el saldo'
    });
  }
}

export async function listarPagos(req, res) {
  try {
    const pagos = await PagosRepository.listarTodos();

    return res.status(200).json({
      mensaje: 'Pagos consultados correctamente',
      total: pagos.length,
      pagos
    });

  } catch (error) {
    console.error('Error al listar pagos:', error);

    return res.status(500).json({
      error: 'No se pudieron consultar los pagos'
    });
  }
}

export async function listarPagosPorReserva(req, res) {
  try {
    const reservaId = Number(req.params.reservaId);

    if (!Number.isInteger(reservaId) || reservaId <= 0) {
      return res.status(400).json({
        error: 'La reserva indicada no es válida'
      });
    }

    const pagos = await PagosRepository.listarPorReserva(reservaId);

    return res.status(200).json({
      mensaje: 'Historial de pagos consultado correctamente',
      reservaId,
      total: pagos.length,
      pagos
    });

  } catch (error) {
    console.error('Error al consultar historial de pagos:', error);

    return res.status(500).json({
      error: 'No se pudo consultar el historial de pagos'
    });
  }
}


export async function listarMisPagos(req, res) {
  try {
    const usuarioId = Number(req.usuario?.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // 1. Buscar las reservas del cliente
    const reservas = await ReservaModel.findAll({
      where: {
        usuario_id: usuarioId
      },
      attributes: ['id']
    });

    const reservaIds = reservas.map(reserva => reserva.id);

    // 2. Si no tiene reservas, no tiene pagos
    if (reservaIds.length === 0) {
      return res.status(200).json({
        mensaje: 'Historial de pagos consultado correctamente',
        total: 0,
        pagos: []
      });
    }

    // 3. Consultar los pagos de sus reservas
    const pagos = await PagoModel.findAll({
      where: {
        reserva_id: {
          [Op.in]: reservaIds
        }
      },
      order: [['fecha_pago', 'DESC']]
    });

    return res.status(200).json({
      mensaje: 'Historial de pagos consultado correctamente',
      total: pagos.length,
      pagos: pagos.map(pago => pago.toJSON())
    });

  } catch (error) {
    console.error('Error al consultar mis pagos:', error);

    return res.status(500).json({
      error: 'No se pudo consultar el historial de pagos'
    });
  }
}
