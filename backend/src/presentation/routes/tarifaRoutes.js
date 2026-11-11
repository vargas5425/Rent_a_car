import { Router } from 'express';
import { listarTarifas, crearTarifa, calcularPrecio } from '../controllers/TarifaController.js';

const router = Router();

router.get('/', listarTarifas);
router.post('/', crearTarifa);
router.get('/calcular/:vehiculoId', calcularPrecio);

export default router;