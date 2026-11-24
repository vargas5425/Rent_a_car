
import { Router } from 'express';

import {
  registrarPago,
  consultarSaldo,
  listarPagos,
  listarPagosPorReserva,
  listarMisPagos
} from '../controllers/PagoController.js';

import { verifyToken,
        authorizeRoles 
} from '../middlewares/authMiddleware.js';

import { ReservaModel } from '../../infrastructure/models/index.js';

const router = Router();

// Registrar un pago: ADMINISTRADOR o EMPLEADO
router.post('/', verifyToken, (req, res, next) => {
  const rol = req.usuario?.rol;

  if (!['ADMINISTRADOR', 'EMPLEADO'].includes(rol)) {
    return res.status(403).json({
      error: 'No tienes permisos para registrar pagos'
    });
  }

  next();
}, registrarPago);

// Consultar saldo de una reserva
router.get('/reserva/:reservaId/saldo', verifyToken, async (req, res, next) => {
  try {
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario?.id;
    const reservaId = Number(req.params.reservaId);

    if (!Number.isInteger(reservaId) || reservaId <= 0) {
      return res.status(400).json({
        error: 'La reserva indicada no es válida'
      });
    }

    if (!['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'].includes(rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para consultar el saldo'
      });
    }

    const reserva = await ReservaModel.findByPk(reservaId);

    if (!reserva) {
      return res.status(404).json({
        error: 'Reserva no encontrada'
      });
    }

    // Un cliente solo puede consultar sus reservas
    if (rol === 'CLIENTE' && Number(reserva.usuario_id) !== Number(usuarioId)) {
      return res.status(403).json({
        error: 'No tienes permisos para consultar esta reserva'
      });
    }

    next();

  } catch (error) {
    console.error('Error al verificar permisos del saldo:', error);

    return res.status(500).json({
      error: 'No se pudo verificar el acceso a la reserva'
    });
  }
}, consultarSaldo);


router.get(
  '/',
  verifyToken,
  authorizeRoles('ADMINISTRADOR', 'EMPLEADO'),
  listarPagos
);


router.get(
  '/reserva/:reservaId',
  verifyToken,
  async (req, res, next) => {
    try {
      const rol = req.usuario?.rol;
      const usuarioId = req.usuario?.id;
      const reservaId = Number(req.params.reservaId);

      if (!Number.isInteger(reservaId) || reservaId <= 0) {
        return res.status(400).json({
          error: 'La reserva indicada no es válida'
        });
      }

      if (!['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'].includes(rol)) {
        return res.status(403).json({
          error: 'No tienes permisos para consultar estos pagos'
        });
      }

      const reserva = await ReservaModel.findByPk(reservaId);

      if (!reserva) {
        return res.status(404).json({
          error: 'Reserva no encontrada'
        });
      }

      if (
        rol === 'CLIENTE' &&
        Number(reserva.usuario_id) !== Number(usuarioId)
      ) {
        return res.status(403).json({
          error: 'No tienes permisos para consultar esta reserva'
        });
      }

      next();

    } catch (error) {
      console.error('Error al verificar acceso a pagos:', error);

      return res.status(500).json({
        error: 'No se pudo verificar el acceso a los pagos'
      });
    }
  },
  listarPagosPorReserva
);

// Consultar los pagos del cliente autenticado
router.get(
  '/mis-pagos',
  verifyToken,
  authorizeRoles('CLIENTE'),
  listarMisPagos
);

export default router;
