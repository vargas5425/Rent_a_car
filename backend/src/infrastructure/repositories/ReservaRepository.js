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
