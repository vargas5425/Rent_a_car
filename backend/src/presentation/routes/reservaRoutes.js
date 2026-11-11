import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';
import {
  postReserva,
  getMisReservas,
  getReservas,
  getReserva,
  patchConfirmarReserva,
  patchCancelarReserva,
  getDisponibilidad
} from '../controllers/ReservaController.js';

const router = Router();
const STAFF = ['EMPLEADO', 'ADMINISTRADOR'];

// IMPORTANTE: las rutas fijas (/mias, /disponibilidad) van ANTES de /:id,
// si no Express interpretaría "mias" como si fuera un id.
router.get('/disponibilidad', verifyToken, getDisponibilidad);
router.get('/mias', verifyToken, getMisReservas);

router.get('/', verifyToken, authorizeRole(STAFF), getReservas);
router.post('/', verifyToken, postReserva);

router.get('/:id', verifyToken, getReserva);
router.patch('/:id/confirmar', verifyToken, authorizeRole(STAFF), patchConfirmarReserva);
router.patch('/:id/cancelar', verifyToken, patchCancelarReserva);

export default router;