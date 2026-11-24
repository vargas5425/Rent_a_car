import { Op } from 'sequelize';
import { sequelize, ReservaModel, VehiculoModel, UsuarioModel } from '../models/index.js';
import { ESTADOS_BLOQUEANTES } from '../../domain/reservas/Reserva.js';

const incluir = [
  { model: VehiculoModel, as: 'vehiculo', attributes: ['id', 'placa', 'marca', 'modelo', 'anio', 'imagen_url'] },
  { model: UsuarioModel, as: 'usuario', attributes: ['id', 'nombre', 'email'] }
];

function condicionSolapamiento(inicio, fin) {
  return {
    estado: { [Op.in]: ESTADOS_BLOQUEANTES },
    fecha_inicio: { [Op.lt]: fin },
    fecha_fin: { [Op.gt]: inicio }
  };
}

class ReservaRepository {
  async findById(id) {
    return await ReservaModel.findByPk(id, { include: incluir });
  }

  async findByUsuario(usuarioId) {
    return await ReservaModel.findAll({
      where: { usuario_id: usuarioId },
      include: incluir,
      order: [['createdAt', 'DESC']]
    });
  }

  async findAll() {
    return await ReservaModel.findAll({
      include: incluir,
      order: [['createdAt', 'DESC']]
    });
  }

  async crearSiDisponible(datos) {
    const id = await sequelize.transaction(async (t) => {
      await VehiculoModel.findByPk(datos.vehiculo_id, { transaction: t, lock: t.LOCK.UPDATE });

      const choque = await ReservaModel.findOne({
        where: {
          vehiculo_id: datos.vehiculo_id,
          ...condicionSolapamiento(datos.fecha_inicio, datos.fecha_fin)
        },
        transaction: t
      });
      if (choque) return null;

      const creada = await ReservaModel.create(datos, { transaction: t });
      return creada.id;
    });

    return id ? await this.findById(id) : null;
  }

  async actualizarEstado(id, estado) {
    const reserva = await ReservaModel.findByPk(id);
    if (!reserva) return null;

    await reserva.update({ estado });

    if (estado === 'CANCELADA') {
      await VehiculoModel.update(
        { estado: 'DISPONIBLE' },
        { where: { id: reserva.vehiculo_id } }
      );
    }

    return await this.findById(id);
  }

  async cambiarEstadoTransaccional(id, estado, options = {}) {
    const queryOptions = {};
    if (options.transaction) {
      queryOptions.transaction = options.transaction;
    }
    const reserva = await ReservaModel.findByPk(id, queryOptions);
    if (!reserva) return null;

    await reserva.update({ estado }, queryOptions);
    return reserva;
  }

  async actualizarEstadoSiLibre(id, estado) {
    const hecho = await sequelize.transaction(async (t) => {
      const reserva = await ReservaModel.findByPk(id, { transaction: t });
      if (!reserva) return false;

      await VehiculoModel.findByPk(reserva.vehiculo_id, { transaction: t, lock: t.LOCK.UPDATE });

      const choque = await ReservaModel.findOne({
        where: {
          vehiculo_id: reserva.vehiculo_id,
          id: { [Op.ne]: reserva.id },
          ...condicionSolapamiento(reserva.fecha_inicio, reserva.fecha_fin)
        },
        transaction: t
      });
      if (choque) return false;

      await reserva.update({ estado }, { transaction: t });
      return true;
    });

    return hecho ? await this.findById(id) : null;
  }

  async idsVehiculosOcupados(inicio, fin) {
    const reservas = await ReservaModel.findAll({
      attributes: ['vehiculo_id'],
      where: condicionSolapamiento(inicio, fin),
      group: ['vehiculo_id']
    });
    return reservas.map((r) => r.vehiculo_id);
  }

  async buscarPorIdTransaccional(id, options = {}) {
    const queryOptions = {};
    if (options.transaction) {
      queryOptions.transaction = options.transaction;
    }
    if (options.lock) {
      queryOptions.lock = options.lock;
    } else {
      queryOptions.include = incluir;
    }
    return await ReservaModel.findByPk(id, queryOptions);
  }
}

export default new ReservaRepository();