import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';
import { getVehiculos, postVehiculo, putVehiculo, deleteVehiculo } from '../controllers/VehiculoController.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = Router();

// GET /api/vehiculos (Ruta protegida: requiere token)
router.get('/', verifyToken, getVehiculos);
router.post('/', verifyToken, authorizeRole(['ADMINISTRADOR']), postVehiculo);
router.put('/:id', verifyToken, authorizeRole(['ADMINISTRADOR']), putVehiculo);
router.delete('/:id', verifyToken, authorizeRole(['ADMINISTRADOR']), deleteVehiculo);

router.post('/upload', verifyToken, authorizeRole(['ADMINISTRADOR']), upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  // Construimos la URL pública de la imagen
  const urlImagen = `/uploads/${req.file.filename}`;
  res.status(200).json({ imagen_url: urlImagen });
});

export default router;