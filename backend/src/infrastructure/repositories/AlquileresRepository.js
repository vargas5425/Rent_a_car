
import { Op } from 'sequelize';
import { AlquilerModel } from '../models/index.js';

class AlquileresRepository {

  // 1. Crear un alquiler
  async crear(datos, options = {}) {
    const alquiler = await AlquilerModel.create(
      datos,
      options
    );

    return alquiler.toJSON();
  }

  // 2. Buscar alquiler por ID
  async buscarPorId(id, options = {}) {
    const alquiler = await AlquilerModel.findByPk(
      id,
      options
    );

    return alquiler ? alquiler.toJSON() : null;
  }

  // 3. Listar todos los alquileres
  async listarTodos(options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      order: [['fecha_inicio', 'DESC']]
    });

    return alquileres.map(alquiler => alquiler.toJSON());
  }

  // 4. Listar alquileres de un usuario
  async listarPorUsuario(usuarioId, options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      where: {
        usuario_id: usuarioId
      },
      order: [['fecha_inicio', 'DESC']]
    });

    return alquileres.map(alquiler => alquiler.toJSON());
  }

  // 5. Listar alquileres de un vehículo
  async listarPorVehiculo(vehiculoId, options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      where: {
        vehiculo_id: vehiculoId
      },
      order: [['fecha_inicio', 'DESC']]
    });

    return alquileres.map(alquiler => alquiler.toJSON());
  }

  // 6. Listar alquileres por estado
  async listarPorEstado(estado, options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      where: {
        estado
      },
      order: [['fecha_inicio', 'DESC']]
    });

    return alquileres.map(alquiler => alquiler.toJSON());
  }

  // 7. Actualizar datos de un alquiler
  async actualizar(id, datos, options = {}) {
    const alquiler = await AlquilerModel.findByPk(
      id,
      options
    );

    if (!alquiler) {
      return null;
    }

    await alquiler.update(datos, options);

    return alquiler.toJSON();
  }

  // 8. Cambiar estado de un alquiler
  async cambiarEstado(id, estado, options = {}) {
    return this.actualizar(id, { estado }, options);
  }

  // 9. Registrar datos de devolución
  async registrarDevolucion(id, datos, options = {}) {
    const campos = {
      fecha_devolucion: datos.fecha_devolucion,
      kilometraje_final: datos.kilometraje_final,
      combustible_final: datos.combustible_final,
      estado: 'FINALIZADO'
    };

    return this.actualizar(id, campos, options);
  }

  // 10. Verificar conflictos de fechas
  async existeSolapamiento(
    vehiculoId,
    fechaInicio,
    fechaFin,
    excluirAlquilerId = null,
    options = {}
  ) {
    const where = {
      vehiculo_id: vehiculoId,
      estado: {
        [Op.in]: ['PENDIENTE', 'ACTIVO']
      },
      fecha_inicio: {
        [Op.lt]: fechaFin
      },
      fecha_fin: {
        [Op.gt]: fechaInicio
      }
    };

    if (excluirAlquilerId !== null) {
      where.id = {
        [Op.ne]: excluirAlquilerId
      };
    }

    const cantidad = await AlquilerModel.count({
      ...options,
      where
    });

    return cantidad > 0;
  }
}

export default new AlquileresRepository();
