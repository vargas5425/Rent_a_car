import { Op, Transaction } from 'sequelize';
import {
  sequelize,
  ReservaModel,
  VehiculoModel,
  UsuarioModel,
  AlquilerModel
} from '../models/index.js';
import {
  ESTADOS,
  ESTADOS_BLOQUEANTES,
  transicionar
} from '../../domain/reservas/Reserva.js';

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

  // Buscar una reserva dentro de una transacción
  async buscarPorIdTransaccional(id, options = {}) {
    const reserva = await ReservaModel.findByPk(id, options);

    return reserva ? reserva.toJSON() : null;
  }

  // Actualizar el estado de una reserva dentro de una transacción
  async cambiarEstadoTransaccional(id, estado, options = {}) {
    const reserva = await ReservaModel.findByPk(id, options);

    if (!reserva) {
      return null;
    }

    await reserva.update(
      { estado },
      options
    );

    return reserva.toJSON();
  }

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
    const id = await sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
      },
      async (t) => {

      // 1. Bloquear el vehículo para evitar reservas simultáneas
      const vehiculo = await VehiculoModel.findByPk(
        datos.vehiculo_id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE
        }
      );

      // 2. Verificar que exista y esté habilitado
      if (
        !vehiculo ||
        !vehiculo.activo ||
        vehiculo.estado === 'MANTENIMIENTO'
      ) {
        return null;
      }

      // 3. Buscar reservas que se superponen
      const choqueReserva = await ReservaModel.findOne({
        where: {
          vehiculo_id: datos.vehiculo_id,
          ...condicionSolapamiento(
            datos.fecha_inicio,
            datos.fecha_fin
          )
        },
        transaction: t
      });

      if (choqueReserva) {
        return null;
      }

      // 4. Buscar alquileres pendientes o activos
      // que se superponen con las fechas solicitadas
      const choqueAlquiler = await AlquilerModel.findOne({
        where: {
          vehiculo_id: datos.vehiculo_id,
          estado: {
            [Op.in]: ['PENDIENTE', 'ACTIVO']
          },
          fecha_inicio: {
            [Op.lt]: datos.fecha_fin
          },
          fecha_fin: {
            [Op.gt]: datos.fecha_inicio
          }
        },
        transaction: t
      });

      if (choqueAlquiler) {
        return null;
      }

      // 5. Crear la reserva
      const creada = await ReservaModel.create(
        datos,
        { transaction: t }
      );

      return creada.id;
    });

    return id ? await this.findById(id) : null;
  }


 
  // Actualizar el estado de una reserva
  async actualizarEstado(id, estado) {
    const reserva = await ReservaModel.findByPk(id);

    if (!reserva) {
      return null;
    }

    // Cambiar únicamente el estado de la reserva
    await reserva.update({ estado });

    // No modificar el estado operativo del vehículo.
    // Las reservas futuras se controlan mediante sus fechas.
    return await this.findById(id);
  }


  
  


  async actualizarEstadoSiLibre(id, estado) {
    const hecho = await sequelize.transaction(
    {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
    },
    async (t) => {

    // 1. Consultar la reserva sin bloquear
    // para conocer el vehículo asociado
    const reservaInicial = await ReservaModel.findByPk(id, {
      transaction: t
    });

    if (!reservaInicial) {
      return false;
    }

    if (estado !== ESTADOS.CONFIRMADA) {
      return false;
    }

    // 2. Bloquear primero el vehículo
    const vehiculo = await VehiculoModel.findByPk(
      reservaInicial.vehiculo_id,
      {
        transaction: t,
        lock: t.LOCK.UPDATE
      }
    );

    if (
      !vehiculo ||
      !vehiculo.activo ||
      vehiculo.estado === 'MANTENIMIENTO'
    ) {
      return false;
    }

    // 3. Bloquear después la reserva
    const reserva = await ReservaModel.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!reserva) {
      return false;
    }

    // 4. Comprobar que no haya cambiado de vehículo
    if (
      Number(reserva.vehiculo_id) !==
      Number(vehiculo.id)
    ) {
      return false;
    }

    // 5. Validar la transición de estado
    transicionar(reserva.estado, ESTADOS.CONFIRMADA);

    // 6. Continuar con las comprobaciones de disponibilidad

    // 4. Verificar reservas superpuestas
    const choqueReserva = await ReservaModel.findOne({
      where: {
        vehiculo_id: reserva.vehiculo_id,
        id: { [Op.ne]: reserva.id },
        ...condicionSolapamiento(
          reserva.fecha_inicio,
          reserva.fecha_fin
        )
      },
      transaction: t
    });

    if (choqueReserva) {
      return false;
    }

    // 5. Verificar alquileres superpuestos
    // Excluir alquileres de la misma reserva
    
    
    const choqueAlquiler = await AlquilerModel.findOne({
      where: {
        vehiculo_id: reserva.vehiculo_id,

        // No considerar el alquiler de esta misma reserva
        [Op.and]: [
          {
            [Op.or]: [
              { reserva_id: null },
              { reserva_id: { [Op.ne]: reserva.id } }
            ]
          },
          {
            [Op.or]: [
              { estado: 'ACTIVO' },
              {
                estado: 'PENDIENTE',
                fecha_inicio: {
                  [Op.lt]: reserva.fecha_fin
                },
                fecha_fin: {
                  [Op.gt]: reserva.fecha_inicio
                }
              }
            ]
          }
        ]
      },
      transaction: t
    });



    if (choqueAlquiler) {
      return false;
    }

    // 6. Confirmar la reserva
    await reserva.update(
      { estado: ESTADOS.CONFIRMADA },
      { transaction: t }
    );

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