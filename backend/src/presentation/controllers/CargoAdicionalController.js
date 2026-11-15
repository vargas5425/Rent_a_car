
import RegistrarCargoAdicional from '../../application/alquileres/RegistrarCargoAdicional.js';

import alquilerRepository from '../../infrastructure/repositories/AlquileresRepository.js';

import cargoRepository from '../../infrastructure/repositories/CargoAdicionalRepository.js';

// Crear el servicio con sus dependencias
const registrarCargoService = new RegistrarCargoAdicional(
  alquilerRepository,
  cargoRepository
);

class CargoAdicionalController {

  async registrar(req, res) {
    try {
      // 1. Obtener el ID del alquiler desde la URL
      const { id } = req.params;

      // 2. Obtener los datos enviados
      const { tipo, descripcion, monto } = req.body ?? {};

      // 3. Ejecutar el caso de uso
      const cargo = await registrarCargoService.ejecutar(
        id,
        {
          tipo,
          descripcion,
          monto
        }
      );

      // 4. Responder correctamente
      return res.status(201).json({
        mensaje: 'Cargo adicional registrado correctamente',
        cargo
      });

    } catch (error) {
      const mensaje = error.message;

      // 5. Errores de validación (400)
      const erroresValidacion = [
        'El ID del alquiler no es válido',
        'Los datos del cargo son obligatorios',
        'El tipo de cargo no es válido',
        'La descripción es obligatoria'
      ];

      if (
        erroresValidacion.includes(mensaje) ||
        mensaje.startsWith('El monto debe')
      ) {
        return res.status(400).json({
          error: mensaje
        });
      }

      // 6. Recursos inexistentes (404)
      const erroresNoEncontrado = [
        'El alquiler no existe',
        'La reserva asociada no existe'
      ];

      if (erroresNoEncontrado.includes(mensaje)) {
        return res.status(404).json({
          error: mensaje
        });
      }

      // 7. Conflictos de estado (409)
      const erroresConflicto = [
        'No se pueden registrar cargos en este alquiler',
        'El alquiler no tiene una reserva asociada',
        'No se pueden registrar cargos en una reserva finalizada',
        'El estado de la reserva no permite registrar cargos adicionales'
      ];

      if (erroresConflicto.includes(mensaje)) {
        return res.status(409).json({
          error: mensaje
        });
      }

      // 8. Errores inesperados (500)
      console.error('Error al registrar cargo:', error);

      return res.status(500).json({
        error: 'Error interno al registrar el cargo adicional'
      });
    }
  }
}

export default new CargoAdicionalController();
