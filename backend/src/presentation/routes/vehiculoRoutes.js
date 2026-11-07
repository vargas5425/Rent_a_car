import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';
import { getVehiculos, postVehiculo, putVehiculo, deleteVehiculo } from '../controllers/VehiculoController.js';

const router = Router();

// GET /api/vehiculos (Ruta protegida: requiere token)
router.get('/', verifyToken, getVehiculos);
router.post('/', verifyToken, authorizeRole(['ADMINISTRADOR']), postVehiculo);
router.put('/:id', verifyToken, authorizeRole(['ADMINISTRADOR']), putVehiculo);
router.delete('/:id', verifyToken, authorizeRole(['ADMINISTRADOR']), deleteVehiculo);

export default router;