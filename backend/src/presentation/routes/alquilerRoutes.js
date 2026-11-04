
import { Router } from 'express';

import CargoAdicionalController from '../controllers/CargoAdicionalController.js';

import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Registrar un cargo adicional a un alquiler
router.post(
  '/:id/cargos-adicionales',
  verifyToken,
  (req, res) => CargoAdicionalController.registrar(req, res)
);

export default router;
