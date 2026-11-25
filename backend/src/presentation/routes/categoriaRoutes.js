import { Router } from 'express';
import { getCategorias, postCategoria } from '../controllers/CategoriaController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/', verifyToken, getCategorias);
router.post('/', verifyToken, authorizeRole(['ADMINISTRADOR']), postCategoria);

export default router;