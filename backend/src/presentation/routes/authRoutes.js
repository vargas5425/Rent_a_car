import { Router } from 'express';
import { register, login } from '../controllers/AuthController.js';
import { verifyToken } from '../middlewares/authMiddleware.js'; 

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Endpoint de prueba protegido
router.get('/perfil', verifyToken, (req, res) => {
  res.json({
    mensaje: 'Acceso concedido a ruta protegida',
    usuario: req.usuario 
  });
});

export default router;