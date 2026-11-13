
import ObtenerAlquileresActivos from '../../application/alquileres/ObtenerAlquileresActivos.js';

import alquilerRepository from '../../infrastructure/repositories/AlquileresRepository.js';

// Crear el servicio con su dependencia
const obtenerAlquileresActivosService = new ObtenerAlquileresActivos(
  alquilerRepository
);

class AlquilerActivoController {

  async listar(req, res) {
    try {
      // 1. Ejecutar el caso de uso
      const alquileres = await obtenerAlquileresActivosService.ejecutar();

      // 2. Devolver los alquileres activos
      return res.status(200).json({
        mensaje: 'Alquileres activos obtenidos correctamente',
        total: alquileres.length,
        alquileres
      });

    } catch (error) {
      // Registrar el error en el servidor
      console.error('Error al obtener alquileres activos:', error);

      // Responder con un error interno
      return res.status(500).json({
        error: 'Error interno al obtener los alquileres activos'
      });
    }
  }
}

export default new AlquilerActivoController();
