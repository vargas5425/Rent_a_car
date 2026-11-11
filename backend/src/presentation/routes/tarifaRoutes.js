import { Router } from 'express';
import { listarTarifas, crearTarifa, calcularPrecio, actualizarTarifa, eliminarTarifa } from '../controllers/TarifaController.js';


const router = Router();

router.get('/', listarTarifas);
router.post('/', crearTarifa);
router.get('/calcular/:vehiculoId', calcularPrecio);
router.put('/:id', actualizarTarifa);
router.delete('/:id', eliminarTarifa);

export default router;