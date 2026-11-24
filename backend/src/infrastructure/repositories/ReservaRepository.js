
import { Op, Transaction } from 'sequelize';

import {
  sequelize,
  ReservaModel,
  VehiculoModel,
  UsuarioModel,
  AlquilerModel,
  HistorialEstadoModel
} from '../models/index.js';

import {
  ESTADOS,
  ESTADOS_BLOQUEANTES,
  transicionar
} from '../../domain/reservas/Reserva.js';

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

// Detectar reservas que se superponen
function condicionSolapamiento(fechaInicio, fechaFin) {
  return {
    estado: {
      [Op.in]: ESTADOS_BLOQUEANTES
    },
    fecha_inicio: {
      [Op.lt]: fechaFin
    },
    fecha_fin: {
      [Op.gt]: fechaInicio
    }
  };
}

// ======================================================
// REPOSITORIO DE RESERVAS
// ======================================================

class ReservaRepository {

  // 1. Buscar reserva por ID
  async findById(id, options = {}) {
    const reserva = await ReservaModel.findByPk(
      id,
      options
    );

    return reserva ? reserva.toJSON() : null;
  }

  // 2. Listar todas las reservas
  async findAll(options = {}) {
    const reservas = await ReservaModel.findAll({
      ...options,
      order: [['fecha_inicio', 'DESC']]
    });

    return reservas.map(reserva => reserva.toJSON());
  }

  // 3. Listar reservas de un usuario
  async findByUsuario(usuarioId, options = {}) {
    const reservas = await ReservaModel.findAll({
      ...options,
      where: {
        usuario_id: usuarioId
      },
      order: [['fecha_inicio', 'DESC']]
    });

    return reservas.map(reserva => reserva.toJSON());
  }

  // 4. Buscar reserva dentro de una transacción
  async buscarPorIdTransaccional(id, options = {}) {
    const reserva = await ReservaModel.findByPk(
      id,
      options
    );

    return reserva ? reserva.toJSON() : null;
  }

  // 5. Cambiar estado dentro de una transacción
  async cambiarEstadoTransaccional(
    id,
    estado,
    options = {}
  ) {
    const reserva = await ReservaModel.findByPk(
      id,
      options
    );

    if (!reserva) {
      return null;
    }

    transicionar(reserva.estado, estado);

    await reserva.update(
      { estado },
      options
    );

    return reserva.toJSON();
  }

  // ====================================================
  // 6. CREAR RESERVA SI EXISTE DISPONIBILIDAD
  // ====================================================

  async crearSiDisponible(datos) {
    const id = await sequelize.transaction(
      {
        isolationLevel:
          Transaction.ISOLATION_LEVELS.READ_COMMITTED
      },
      async (t) => {

        // Bloquear vehículo
        const vehiculo = await VehiculoModel.findByPk(
          datos.vehiculo_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE
          }
        );

        // Validar vehículo
        if (
          !vehiculo ||
          !vehiculo.activo ||
          vehiculo.estado === 'MANTENIMIENTO'
        ) {
          return null;
        }

        // Verificar reservas superpuestas
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

        // Verificar alquileres superpuestos
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

        // Crear reserva
        const creada = await ReservaModel.create(
          datos,
          { transaction: t }
        );

        // Registrar historial de creación
        await HistorialEstadoModel.create(
          {
            tipo_entidad: 'RESERVA',
            entidad_id: creada.id,
            estado_anterior: null,
            estado_nuevo: creada.estado,
            usuario_id: datos.usuario_id,
            observacion: 'Creación de una nueva reserva',
            fecha_cambio: new Date()
          },
          { transaction: t }
        );

        return creada.id;
      }
    );

    return id ? await this.findById(id) : null;
  }

  // ====================================================
  // 7. CONFIRMAR RESERVA SI EXISTE DISPONIBILIDAD
  // ====================================================

  async actualizarEstadoSiLibre(id, estado, usuarioId) {
    const hecho = await sequelize.transaction(
      {
        isolationLevel:
          Transaction.ISOLATION_LEVELS.READ_COMMITTED
      },
      async (t) => {

        // Consultar reserva inicial
        const reservaInicial = await ReservaModel.findByPk(
          id,
          { transaction: t }
        );

        if (!reservaInicial) {
          return false;
        }

        if (estado !== ESTADOS.CONFIRMADA) {
          return false;
        }

        // Bloquear primero el vehículo
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

        // Bloquear después la reserva
        const reserva = await ReservaModel.findByPk(
          id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE
          }
        );

        if (!reserva) {
          return false;
        }

        // Verificar que no haya cambiado de vehículo
        if (
          Number(reserva.vehiculo_id) !==
          Number(vehiculo.id)
        ) {
          return false;
        }

        // Validar transición
        transicionar(
          reserva.estado,
          ESTADOS.CONFIRMADA
        );

        // Verificar reservas superpuestas
        const choqueReserva = await ReservaModel.findOne({
          where: {
            vehiculo_id: reserva.vehiculo_id,
            id: {
              [Op.ne]: reserva.id
            },
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

        // Verificar alquileres superpuestos
        const choqueAlquiler = await AlquilerModel.findOne({
          where: {
            vehiculo_id: reserva.vehiculo_id,

            [Op.and]: [
              {
                [Op.or]: [
                  {
                    reserva_id: null
                  },
                  {
                    reserva_id: {
                      [Op.ne]: reserva.id
                    }
                  }
                ]
              },
              {
                [Op.or]: [
                  {
                    estado: 'ACTIVO'
                  },
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

        // Guardar estado anterior
        const estadoAnterior = reserva.estado;

        // Confirmar reserva
        await reserva.update(
          {
            estado: ESTADOS.CONFIRMADA
          },
          { transaction: t }
        );

        // Registrar historial de confirmación
        await HistorialEstadoModel.create(
          {
            tipo_entidad: 'RESERVA',
            entidad_id: reserva.id,
            estado_anterior: estadoAnterior,
            estado_nuevo: ESTADOS.CONFIRMADA,
            usuario_id: usuarioId,
            observacion:
              'Reserva confirmada por el personal autorizado',
            fecha_cambio: new Date()
          },
          { transaction: t }
        );

        return true;
      }
    );

    return hecho ? await this.findById(id) : null;
  }
}

export default new ReservaRepository();
