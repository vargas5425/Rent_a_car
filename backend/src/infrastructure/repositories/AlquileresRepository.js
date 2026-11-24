import { Op } from 'sequelize';

import * as Models from '../models/index.js';
const { AlquilerModel, UsuarioModel, VehiculoModel } = Models;

class AlquileresRepository {

  async crear(datos, options = {}) {
    const alquiler = await AlquilerModel.create(datos, options);
    return alquiler.toJSON();
  }

  async buscarPorId(id, options = {}) {
    const alquiler = await AlquilerModel.findByPk(id, options);
    return alquiler ? alquiler.toJSON() : null;
  }

  // 👇 NUEVO: con relaciones, para GET /alquileres/:id
  async buscarPorIdConRelaciones(id, options = {}) {
    const alquiler = await AlquilerModel.findByPk(id, {
      ...options,
      include: [
        {
          model: UsuarioModel,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: UsuarioModel,
          as: 'empleadoEntrega',
          attributes: ['id', 'nombre', 'email', 'rol']
        },
        {
          model: VehiculoModel,
          as: 'vehiculo',
          attributes: ['id', 'marca', 'modelo', 'placa', 'categoria_id', 'kilometraje_actual']
        }
      ]
    });
    return alquiler ? alquiler.toJSON() : null;
  }

  async listarTodos(options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      order: [['fecha_inicio', 'DESC']]
    });
    return alquileres.map(alquiler => alquiler.toJSON());
  }

  async listarPorUsuario(usuarioId, options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      where: { usuario_id: usuarioId },
      order: [['fecha_inicio', 'DESC']]
    });
    return alquileres.map(alquiler => alquiler.toJSON());
  }

  async listarPorVehiculo(vehiculoId, options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      where: { vehiculo_id: vehiculoId },
      order: [['fecha_inicio', 'DESC']]
    });
    return alquileres.map(alquiler => alquiler.toJSON());
  }

  async listarPorEstado(estado, options = {}) {
    const alquileres = await AlquilerModel.findAll({
      ...options,
      where: { estado },
      include: [
        {
          model: UsuarioModel,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: UsuarioModel,
          as: 'empleadoEntrega',
          attributes: ['id', 'nombre', 'email', 'rol']
        },
        {
          model: VehiculoModel,
          as: 'vehiculo',
          attributes: ['id', 'marca', 'modelo', 'placa']
        }
      ],
      order: [['fecha_inicio', 'DESC']]
    });
    return alquileres.map(alquiler => alquiler.toJSON());
  }

  async existeOtroAlquilerActivo(vehiculoId, alquilerId, options = {}) {
    const cantidad = await AlquilerModel.count({
      where: {
        vehiculo_id: vehiculoId,
        estado: 'ACTIVO',
        id: { [Op.ne]: alquilerId }
      },
      transaction: options.transaction
    });
    return cantidad > 0;
  }

  async actualizar(id, datos, options = {}) {
    const alquiler = await AlquilerModel.findByPk(id, options);
    if (!alquiler) return null;
    await alquiler.update(datos, options);
    return alquiler.toJSON();
  }

  // 👇 NUEVO: actualizar solo monto_total (con transaction)
  async actualizarMontoTotal(id, montoTotal, options = {}) {
    const alquiler = await AlquilerModel.findByPk(id, {
      transaction: options.transaction
    });
    if (!alquiler) return null;
    await alquiler.update(
      { monto_total: montoTotal },
      { transaction: options.transaction }
    );
    return alquiler.toJSON();
  }

  async cambiarEstado(id, estado, options = {}) {
    return this.actualizar(id, { estado }, options);
  }

  async registrarEntrega(id, datos, options = {}) {
    const campos = {
      fecha_entrega: datos.fecha_entrega,
      kilometraje_inicial: datos.kilometraje_inicial,
      combustible_inicial: datos.combustible_inicial,
      observaciones_entrega: datos.observaciones_entrega ?? null,
      empleado_entrega_id: datos.empleado_entrega_id ?? null,
      deposito_garantia: datos.deposito_garantia ?? 0,
      estado: 'ACTIVO'
    };
    return this.actualizar(id, campos, options);
  }

  async registrarDevolucion(id, datos, options = {}) {
    const campos = {
      fecha_devolucion: datos.fecha_devolucion,
      kilometraje_final: datos.kilometraje_final,
      combustible_final: datos.combustible_final,
      observaciones_devolucion: datos.observaciones_devolucion,
      estado: 'FINALIZADO'
    };
    return this.actualizar(id, campos, options);
  }

  async existeSolapamiento(
    vehiculoId,
    fechaInicio,
    fechaFin,
    excluirAlquilerId = null,
    options = {}
  ) {
    const where = {
      vehiculo_id: vehiculoId,
      [Op.or]: [
        { estado: 'ACTIVO' },
        {
          estado: 'PENDIENTE',
          fecha_inicio: { [Op.lt]: fechaFin },
          fecha_fin: { [Op.gt]: fechaInicio }
        }
      ]
    };

    if (excluirAlquilerId !== null) {
      where.id = { [Op.ne]: excluirAlquilerId };
    }

    const cantidad = await AlquilerModel.count({ ...options, where });
    return cantidad > 0;
  }
}

export default new AlquileresRepository();