import { Op } from 'sequelize';
import { sequelize, ReservaModel, VehiculoModel, UsuarioModel } from '../models/index.js';
import { ESTADOS_BLOQUEANTES } from '../../domain/reservas/Reserva.js';

// Qué datos de las relaciones se devuelven. Nunca incluir la contraseña del usuario.
const incluir = [
  { model: VehiculoModel, as: 'vehiculo', attributes: ['id', 'placa', 'marca', 'modelo', 'anio', 'imagen_url'] },
  { model: UsuarioModel, as: 'usuario', attributes: ['id', 'nombre', 'email'] }
];

// Dos intervalos [inicio, fin) se solapan si inicioA < finB Y inicioB < finA.
// Es la misma regla de SolapamientoService.haySolapamiento, expresada en SQL.
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

  // Crea la reserva SOLO si el vehículo está libre en ese intervalo; si no, devuelve null.
  // La comprobación y el insert van en una transacción con el vehículo bloqueado (SELECT ... FOR UPDATE),
  // así dos clientes que reserven el mismo auto a la vez no pueden colarse los dos.
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
    return await this.findById(id);
  }

  // Cambia el estado SOLO si el intervalo de esta reserva sigue libre; si otra reserva vigente
  // ya lo ocupa, no cambia nada y devuelve null. Es la "revalidación" antes de confirmar:
  // misma transacción y mismo bloqueo del vehículo que crearSiDisponible, para que una
  // confirmación no se cruce con otra operación sobre el mismo auto.
  // La propia reserva se excluye de la comparación (id distinto), si no chocaría consigo misma.
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

  // Ids de los vehículos que tienen una reserva bloqueante que choca con [inicio, fin).
  async idsVehiculosOcupados(inicio, fin) {
    const reservas = await ReservaModel.findAll({
      attributes: ['vehiculo_id'],
      where: condicionSolapamiento(inicio, fin),
      group: ['vehiculo_id']
    });
    return reservas.map((r) => r.vehiculo_id);
  }
}

export default new ReservaRepository();