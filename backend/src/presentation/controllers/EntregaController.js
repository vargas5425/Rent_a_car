
import { registrarEntrega } from '../../application/alquileres/RegistrarEntrega.js';

class EntregaController {

  async registrar(req, res) {
    try {
      // 1. Obtener el ID del alquiler
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

      // 4. Ejecutar el caso de uso
      const resultado = await registrarEntrega(id, {
        kilometraje_inicial,
        combustible_inicial
      });

      // 5. Devolver el resultado completo
      return res.status(200).json(resultado);

    } catch (error) {
      const mensaje = error.message;

      // Errores de datos ingresados
      if (
        mensaje === 'El ID del alquiler no es válido' ||
        mensaje.startsWith('El kilometraje inicial') ||
        mensaje.startsWith('El combustible inicial') ||
        mensaje === 'El alquiler no tiene una reserva asociada'
        
      ) {
        return res.status(400).json({
          error: mensaje
        });
      }

      // Registros inexistentes
      if (
        mensaje === 'El alquiler no existe' ||
        mensaje === 'La reserva asociada no existe' ||
        mensaje === 'El vehículo no existe o está inactivo'
      ) {
        return res.status(404).json({
          error: mensaje
        });
      }

      // Conflictos de estados o datos
      if (
        mensaje === 'Solo se pueden entregar alquileres pendientes' ||
        mensaje === 'Este alquiler ya tiene una entrega registrada' ||
        mensaje === 'La reserva debe estar confirmada para entregar el vehículo' ||
        mensaje === 'Los datos del alquiler no coinciden con la reserva' ||
        mensaje === 'El vehículo no está disponible para realizar la entrega' ||
        mensaje === 'El vehículo ya tiene otro alquiler activo' ||
        mensaje === 'No se puede entregar el vehículo antes de la fecha de inicio de la reserva' ||
        mensaje === 'El kilometraje inicial no puede ser menor al kilometraje actual del vehículo'
      ) {
        return res.status(409).json({
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
