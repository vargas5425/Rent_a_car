import { Router } from 'express';
import * as alquilerController from '../controllers/AlquilerController.js';
// 👇 Corregido: verifyToken viene de authMiddleware, authorizeRole de roleMiddleware
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';

const router = Router();
const STAFF = ['EMPLEADO', 'ADMINISTRADOR'];

// Todas estas rutas requieren estar logueado
router.use(verifyToken);

// ==========================================
// RUTAS DE EMPLEADO Y ADMINISTRADOR
// ==========================================

// 1. Crear un alquiler a partir de una reserva confirmada
router.post(
  '/',
  authorizeRole(STAFF),
  alquilerController.postCrearAlquiler
);

// 2. Ver los alquileres pendientes de entrega
router.get(
  '/pendientes',
  authorizeRole(STAFF),
  alquilerController.getPendientes
);

// 3. Ver los alquileres activos (autos en la calle)
router.get(
  '/activos',
  authorizeRole(STAFF),
  alquilerController.getActivos
);

// 4. Obtener historial de alquileres
router.get(
  '/historial',
  authorizeRole(STAFF),
  alquilerController.getHistorial
);

// 5. Registrar la entrega de un vehículo (PENDIENTE -> ACTIVO)
router.patch(
  '/:id/entrega',
  authorizeRole(STAFF),
  alquilerController.patchEntrega
);

// 6. Registrar la devolución de un vehículo (ACTIVO -> FINALIZADO)
router.patch(
  '/:id/devolucion',
  authorizeRole(STAFF),
  alquilerController.patchDevolucion
);

// 7. Registrar un cargo adicional (daño, limpieza, etc.)
router.post(
  '/:id/cargos',
  authorizeRole(STAFF),
  alquilerController.postCargo
);

// 8. 👇 NUEVO: Obtener un alquiler por ID (va al final para no chocar con las rutas fijas)
router.get(
  '/:id',
  authorizeRole(STAFF),
  alquilerController.getPorId
);

export default router;