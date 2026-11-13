
import ObtenerAlquileresPendientes from '../../application/alquileres/ObtenerAlquileresPendientes.js';

import alquilerRepository from '../../infrastructure/repositories/AlquileresRepository.js';

const obtenerAlquileresPendientesService =
  new ObtenerAlquileresPendientes(alquilerRepository);

class AlquilerPendienteController {

  async listar(req, res) {
    try {
      const alquileres =
        await obtenerAlquileresPendientesService.ejecutar();

      return res.status(200).json({
        mensaje: 'Alquileres pendientes obtenidos correctamente',
        total: alquileres.length,
        alquileres
      });

    } catch (error) {
      console.error(
        'Error al obtener alquileres pendientes:',
        error
      );

      return res.status(500).json({
        error: 'Error interno al obtener los alquileres pendientes'
      });
    }
  }
}

export default new AlquilerPendienteController();
