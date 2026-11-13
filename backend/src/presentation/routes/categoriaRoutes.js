import { Router } from 'express';
import { getCategorias } from '../controllers/CategoriaController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta para obtener todas las categorías (requiere estar logueado)
router.get('/', verifyToken, getCategorias);

export default router;