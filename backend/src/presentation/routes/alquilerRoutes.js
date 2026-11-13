
import { Router } from 'express';

import CargoAdicionalController from '../controllers/CargoAdicionalController.js';
import EntregaController from '../controllers/EntregaController.js';
import AlquilerActivoController from '../controllers/AlquilerActivoController.js';
import DevolucionController from '../controllers/DevolucionController.js';
import CrearAlquilerController from '../controllers/CrearAlquilerController.js';
import HistorialAlquileresController from '../controllers/HistorialAlquileresController.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/authMiddleware.js';

const router = Router();

// Crear alquiler desde una reserva confirmada
router.post(
  '/',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => CrearAlquilerController.registrar(req, res)
);

// 1. Obtener todos los alquileres activos
router.get(
  '/activos',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => AlquilerActivoController.listar(req, res)
);


 // Obtener historial de alquileres finalizados
router.get(
  '/historial',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => HistorialAlquileresController.listar(req, res)
);

// 2. Registrar un cargo adicional a un alquiler
router.post(
  '/:id/cargos-adicionales',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => CargoAdicionalController.registrar(req, res)
);


// 3. Registrar la entrega de un vehículo
router.post(
  '/:id/entrega',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => EntregaController.registrar(req, res)
);

// 4. Registrar la devolución de un vehículo
router.post(
  '/:id/devolucion',
  verifyToken,
  authorizeRoles('EMPLEADO', 'ADMINISTRADOR'),
  (req, res) => DevolucionController.registrar(req, res)
);

export default router;
