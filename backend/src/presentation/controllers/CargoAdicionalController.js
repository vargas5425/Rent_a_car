
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
      // Obtener el ID del alquiler desde la URL
      const { id } = req.params;

      // Obtener los datos enviados en el body
      const { tipo, descripcion, monto } = req.body ?? {};

      // Ejecutar el caso de uso
      const cargo = await registrarCargoService.ejecutar(
        id,
        {
          tipo,
          descripcion,
          monto
        }
      );

      // Respuesta exitosa
      return res.status(201).json({
        mensaje: 'Cargo adicional registrado correctamente',
        cargo
      });

    } catch (error) {
      // Errores de validación conocidos
      const mensaje = error.message;

      if (
        mensaje === 'El ID del alquiler no es válido' ||
        mensaje === 'El tipo de cargo no es válido' ||
        mensaje === 'La descripción es obligatoria' ||
        mensaje.startsWith('El monto debe')
      ) {
        return res.status(400).json({
          error: mensaje
        });
      }

      if (mensaje === 'El alquiler no existe') {
        return res.status(404).json({
          error: mensaje
        });
      }

      if (mensaje === 'No se pueden registrar cargos en este alquiler') {
        return res.status(409).json({
          error: mensaje
        });
      }

      // Error inesperado
      console.error('Error al registrar cargo:', error);

      return res.status(500).json({
        error: 'Error interno al registrar el cargo adicional'
      });
    }
  }
}

export default new CargoAdicionalController();
