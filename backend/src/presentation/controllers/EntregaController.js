
import { registrarEntrega } from '../../application/alquileres/RegistrarEntrega.js';

class EntregaController {

  async registrar(req, res) {
    try {
      // 1. Obtener el ID del alquiler desde la URL
      const { id } = req.params;

      // 2. Validar el ID
      if (!/^[1-9]\d*$/.test(String(id))) {
        return res.status(400).json({
          error: 'El ID del alquiler no es válido'
        });
      }

      // 3. Obtener los datos de entrega
      const {
        kilometraje_inicial,
        combustible_inicial
      } = req.body ?? {};

      // 4. Ejecutar el servicio de entrega
      const alquiler = await registrarEntrega(id, {
        kilometraje_inicial,
        combustible_inicial
      });

      // 5. Responder al cliente
      return res.status(200).json({
        mensaje: 'Entrega registrada correctamente',
        alquiler
      });

    } catch (error) {
      const mensaje = error.message;

      // Errores de validación
      if (
        mensaje.startsWith('El kilometraje inicial') ||
        mensaje.startsWith('El combustible inicial')
      ) {
        return res.status(400).json({
          error: mensaje
        });
      }

      // Alquiler inexistente
      if (mensaje === 'El alquiler no existe') {
        return res.status(404).json({
          error: mensaje
        });
      }

      // Conflictos con el estado del alquiler o vehículo
      if (
        mensaje === 'Solo se pueden entregar alquileres pendientes' ||
        mensaje === 'Este alquiler ya tiene una entrega registrada' ||
        mensaje === 'El vehículo debe estar en estado RESERVADA'
      ) {
        return res.status(409).json({
          error: mensaje
        });
      }

      // Vehículo inexistente o inactivo
      if (mensaje === 'El vehículo no existe o está inactivo') {
        return res.status(404).json({
          error: mensaje
        });
      }

      // Error inesperado
      console.error('Error al registrar entrega:', error);

      return res.status(500).json({
        error: 'Error interno al registrar la entrega'
      });
    }
  }
}

export default new EntregaController();
