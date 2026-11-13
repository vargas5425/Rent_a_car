
import { crearAlquilerDesdeReserva } from '../../application/alquileres/CrearAlquilerDesdeReserva.js';

class CrearAlquilerController {
  async registrar(req, res) {
    try {
      const { reservaId } = req.body;

      const alquiler = await crearAlquilerDesdeReserva(reservaId);

      return res.status(201).json({
        mensaje: 'Alquiler creado correctamente',
        alquiler
      });

    } catch (error) {
      console.error('Error al crear alquiler:', error);

      const mensajesValidacion = [
        'El ID de la reserva no es válido',
        'La reserva no existe',
        'Solo se pueden crear alquileres desde reservas confirmadas',
        'Los importes de la reserva no son válidos'
      ];

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          mensaje: 'Esta reserva ya tiene un alquiler asociado'
        });
      }

      const status = mensajesValidacion.includes(error.message)
        ? 400
        : 500;

      return res.status(status).json({
        mensaje: error.message
      });
    }
  }
}

export default new CrearAlquilerController();
