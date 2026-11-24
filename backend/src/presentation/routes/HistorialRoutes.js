
import { Router } from 'express';

import HistorialEstadoController from '../controllers/HistorialEstadoController.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Historial del cliente autenticado
router.get(
  '/mio',
  verifyToken,
  authorizeRoles('CLIENTE'),
  (req, res) =>
    HistorialEstadoController.listarMiHistorial(req, res)
);

// 2. Consultar todo el historial
router.get(
  '/',
  verifyToken,
  authorizeRoles('ADMINISTRADOR', 'EMPLEADO'),
  (req, res) =>
    HistorialEstadoController.listarTodos(req, res)
);

// 3. Consultar historial por entidad
router.get(
  '/:tipoEntidad/:id',
  verifyToken,
  authorizeRoles('ADMINISTRADOR', 'EMPLEADO'),
  (req, res) =>
    HistorialEstadoController.listarPorEntidad(req, res)
);

export default router;
