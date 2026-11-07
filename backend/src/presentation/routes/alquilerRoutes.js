
import { Router } from 'express';

import CargoAdicionalController from '../controllers/CargoAdicionalController.js';
import EntregaController from '../controllers/EntregaController.js';
import AlquilerActivoController from '../controllers/AlquilerActivoController.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Obtener todos los alquileres activos
router.get(
  '/activos',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => AlquilerActivoController.listar(req, res)
);

// 2. Registrar un cargo adicional a un alquiler
router.post(
  '/:id/cargos-adicionales',
  verifyToken,
  (req, res) => CargoAdicionalController.registrar(req, res)
);

// 3. Registrar la entrega de un vehículo
router.post(
  '/:id/entrega',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => EntregaController.registrar(req, res)
);

export default router;
