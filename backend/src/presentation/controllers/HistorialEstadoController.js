
import HistorialRepository from '../../infrastructure/repositories/HistorialRepository.js';

class HistorialEstadoController {

  // 1. Consultar todo el historial
  async listarTodos(req, res) {
    try {
      const historial = await HistorialRepository.listarTodos();

      return res.status(200).json({
        total: historial.length,
        historial
      });

    } catch (error) {
      console.error('Error al listar historial:', error);

      return res.status(500).json({
        error: 'No se pudo consultar el historial'
      });
    }
  }

  // 2. Consultar historial por entidad
  async listarPorEntidad(req, res) {
    try {
      const { tipoEntidad, id } = req.params;

      const tiposPermitidos = [
        'ALQUILER',
        'RESERVA',
        'VEHICULO'
      ];

      if (!tiposPermitidos.includes(tipoEntidad)) {
        return res.status(400).json({
          error: 'Tipo de entidad no válido'
        });
      }

      if (!/^[1-9]\d*$/.test(String(id))) {
        return res.status(400).json({
          error: 'El ID de la entidad no es válido'
        });
      }

      const historial =
        await HistorialRepository.listarPorEntidad(
          tipoEntidad,
          Number(id)
        );

      return res.status(200).json({
        tipoEntidad,
        entidadId: Number(id),
        total: historial.length,
        historial
      });

    } catch (error) {
      console.error('Error al consultar historial:', error);

      return res.status(500).json({
        error: 'No se pudo consultar el historial de la entidad'
      });
    }
  }

  // 3. Consultar historial del cliente autenticado
  async listarMiHistorial(req, res) {
    try {
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        return res.status(401).json({
          error: 'Usuario no autenticado'
        });
      }

      const registros =
        await HistorialRepository.listarPorCliente(usuarioId);

      // Mostrar únicamente los campos necesarios
      // para el cliente.
      const historial = registros.map(registro => ({
        id: registro.id,
        tipo_entidad: registro.tipo_entidad,
        entidad_id: registro.entidad_id,
        estado_anterior: registro.estado_anterior,
        estado_nuevo: registro.estado_nuevo,
        fecha_cambio: registro.fecha_cambio
      }));

      return res.status(200).json({
        total: historial.length,
        historial
      });

    } catch (error) {
      console.error(
        'Error al consultar historial del cliente:',
        error
      );

      return res.status(500).json({
        error: 'No se pudo consultar tu historial'
      });
    }
  }
}

export default new HistorialEstadoController();
