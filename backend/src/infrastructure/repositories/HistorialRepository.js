import { Op } from 'sequelize';

import {
  HistorialEstadoModel,
  ReservaModel,
  AlquilerModel
} from '../models/index.js';

class HistorialRepository {

  // Registrar un cambio de estado
  async crear(datos, options = {}) {
    const historial = await HistorialEstadoModel.create(
      datos,
      options
    );

    return historial.toJSON();
  }

  // Buscar un registro de historial por ID
  async buscarPorId(id, options = {}) {
    const historial = await HistorialEstadoModel.findByPk(
      id,
      options
    );

    return historial ? historial.toJSON() : null;
  }

  // Consultar historial de una entidad
  async listarPorEntidad(tipoEntidad, entidadId, options = {}) {
    const historial = await HistorialEstadoModel.findAll({
      ...options,
      where: {
        tipo_entidad: tipoEntidad,
        entidad_id: entidadId
      },
      order: [
        ['fecha_cambio', 'DESC'],
        ['id', 'DESC']
      ]
    });

    return historial.map(registro => registro.toJSON());
  }

  // Consultar historial de todas las entidades
  async listarTodos(options = {}) {
    const historial = await HistorialEstadoModel.findAll({
      ...options,
      order: [
        ['fecha_cambio', 'DESC'],
        ['id', 'DESC']
      ]
    });

    return historial.map(registro => registro.toJSON());
  }

  // Consultar cambios realizados por un usuario
  async listarPorUsuario(usuarioId, options = {}) {
    const historial = await HistorialEstadoModel.findAll({
      ...options,
      where: {
        usuario_id: usuarioId
      },
      order: [
        ['fecha_cambio', 'DESC'],
        ['id', 'DESC']
      ]
    });

    return historial.map(registro => registro.toJSON());
  }

async listarPorCliente(usuarioId, options = {}) {

  // 1. Obtener las reservas del cliente
  const reservas = await ReservaModel.findAll({
    ...options,
    where: {
      usuario_id: usuarioId
    },
    attributes: ['id']
  });

  const reservaIds = reservas.map(
    reserva => reserva.id
  );

  // 2. Obtener los alquileres del cliente
  const alquileres = await AlquilerModel.findAll({
    ...options,
    where: {
      usuario_id: usuarioId
    },
    attributes: ['id']
  });

  const alquilerIds = alquileres.map(
    alquiler => alquiler.id
  );

  // 3. Construir las condiciones de búsqueda
  const condiciones = [];

  if (reservaIds.length > 0) {
    condiciones.push({
      tipo_entidad: 'RESERVA',
      entidad_id: {
        [Op.in]: reservaIds
      }
    });
  }

  if (alquilerIds.length > 0) {
    condiciones.push({
      tipo_entidad: 'ALQUILER',
      entidad_id: {
        [Op.in]: alquilerIds
      }
    });
  }

  // 4. Si el cliente no tiene operaciones
  if (condiciones.length === 0) {
    return [];
  }

  // 5. Consultar el historial correspondiente
  const historial = await HistorialEstadoModel.findAll({
    ...options,
    where: {
      [Op.or]: condiciones
    },
    order: [
      ['fecha_cambio', 'DESC'],
      ['id', 'DESC']
    ]
  });

  return historial.map(
    registro => registro.toJSON()
  );
}

}

export default new HistorialRepository();
