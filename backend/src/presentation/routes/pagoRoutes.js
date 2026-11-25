import { Router } from 'express';
import * as pagoController from '../controllers/PagoController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';

const router = Router({ mergeParams: true });
const STAFF = ['EMPLEADO', 'ADMINISTRADOR'];

router.use(verifyToken);

// Registrar un pago asociado a un alquiler: POST /api/alquileres/:id/pagos
router.post(
  '/:id/pagos',
  authorizeRole(STAFF),
  pagoController.postRegistrarPago
);

// Listar pagos y resumen de un alquiler: GET /api/alquileres/:id/pagos
router.get(
  '/:id/pagos',
  authorizeRole(STAFF),
  pagoController.getPagosPorAlquiler
);

export default router;