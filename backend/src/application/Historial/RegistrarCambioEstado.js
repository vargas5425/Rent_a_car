
import {
  ReservaModel,
  AlquilerModel,
  VehiculoModel
} from '../../infrastructure/models/index.js';

import HistorialRepository from '../../infrastructure/repositories/HistorialRepository.js';

const MODELOS = {
  RESERVA: ReservaModel,
  ALQUILER: AlquilerModel,
  VEHICULO: VehiculoModel
};

export default class RegistrarCambioEstado {

  async ejecutar({
    tipoEntidad,
    entidadId,
    estadoAnterior,
    estadoNuevo,
    usuarioId = null,
    observacion = null,
    transaction
  }) {

    // 1. Validar el tipo de entidad
    if (!Object.hasOwn(MODELOS, tipoEntidad)) {
      throw new Error('Tipo de entidad no válido');
    }

    // 2. Validar el identificador
    const id = Number(entidadId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Identificador de entidad no válido');
    }

    // 3. Validar el nuevo estado
    if (
      typeof estadoNuevo !== 'string' ||
      estadoNuevo.trim() === ''
    ) {
      throw new Error('El nuevo estado es obligatorio');
    }

    // 4. Evitar registrar cambios inexistentes
    if (estadoAnterior === estadoNuevo) {
      throw new Error('El estado anterior y el nuevo son iguales');
    }

    // 5. Comprobar que existe la entidad
    const modelo = MODELOS[tipoEntidad];

    const entidad = await modelo.findByPk(id, {
      transaction
    });

    if (!entidad) {
      throw new Error('La entidad indicada no existe');
    }

    // 6. Registrar el cambio de estado
    return HistorialRepository.crear(
      {
        tipo_entidad: tipoEntidad,
        entidad_id: id,
        estado_anterior: estadoAnterior,
        estado_nuevo: estadoNuevo,
        usuario_id: usuarioId,
        observacion,
        fecha_cambio: new Date()
      },
      { transaction }
    );
  }
}
