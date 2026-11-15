
import { registrarDevolucion } from '../../application/alquileres/RegistrarDevolucion.js';

class DevolucionController {

  async registrar(req, res) {
    try {
      const { id } = req.params;

      // 1. Recibir datos de la devolución
      const {
        kilometraje_final,
        combustible_final,
        requiere_mantenimiento,
        observaciones_devolucion
      } = req.body;

      // 2. Enviar datos al servicio
      const resultado = await registrarDevolucion(id, {
        kilometraje_final,
        combustible_final,
        requiere_mantenimiento,
        observaciones_devolucion
      });

      // 3. Responder si la devolución fue exitosa
      return res.status(200).json(resultado);

    } catch (error) {
      console.error('Error al registrar devolución:', error);

      // 4. Errores de validación conocidos
      
    const mensajesValidacion = [
        'El ID del alquiler no es válido',
        'El kilometraje final debe ser un entero positivo o cero',
        'El combustible final debe estar entre 0 y 100',
        'Debes indicar si el vehículo requiere mantenimiento',
        'Debes ingresar las observaciones de devolución',

        // Validaciones del alquiler
        'El alquiler no existe',
        'Solo se pueden devolver alquileres activos',
        'No se puede devolver un vehículo que no fue entregado',
        'Este alquiler ya tiene una devolución registrada',
        'El kilometraje final no puede ser menor al inicial',
        'La fecha de entrega registrada no es válida',
        'La fecha de devolución no puede ser anterior a la fecha de entrega',

        // Validaciones de la reserva
        'El alquiler no tiene una reserva asociada',
        'La reserva asociada no existe',
        'La reserva debe estar entregada para registrar la devolución',
        'Los datos del alquiler no coinciden con la reserva',

        // Validaciones del vehículo
        'El vehículo asociado no existe',
        'El vehículo no se encuentra en estado ALQUILADA',

        // Validaciones de cargos adicionales
        'Las fechas de devolución no son válidas',
        'La modalidad del alquiler no es válida',
        'El precio del alquiler no es válido',
        'Los niveles de combustible deben estar entre 0 y 100'
        
    ];


      // 5. Determinar código HTTP
      const mensajesConflicto = [
        'La fecha de entrega registrada no es válida',
        'La fecha de devolución no puede ser anterior a la fecha de entrega'
        ];

        const status = mensajesConflicto.includes(error.message)
        ? 409
        : mensajesValidacion.includes(error.message)
            ? 400
            : 500;

      return res.status(status).json({
        mensaje: error.message
      });
    }
  }
}

export default new DevolucionController();
