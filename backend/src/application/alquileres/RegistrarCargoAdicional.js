
import { sequelize } from '../../infrastructure/models/index.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';

const TIPOS_CARGO = [
  'DANIO',
  'LIMPIEZA',
  'KILOMETRAJE',
  'OTRO'
];

class RegistrarCargoAdicional {
  constructor(alquilerRepository, cargoAdicionalRepository) {
    this.alquilerRepository = alquilerRepository;
    this.cargoAdicionalRepository = cargoAdicionalRepository;
  }

  async ejecutar(alquilerId, datos) {
    // 1. Validar el ID del alquiler
    const id = Number(alquilerId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('El ID del alquiler no es válido');
    }

    // 2. Validar los datos del cargo
    if (!datos || typeof datos !== 'object') {
      throw new Error('Los datos del cargo son obligatorios');
    }

    const { tipo, descripcion, monto } = datos;

    if (!TIPOS_CARGO.includes(tipo)) {
      throw new Error('El tipo de cargo no es válido');
    }

    if (
      typeof descripcion !== 'string' ||
      descripcion.trim() === ''
    ) {
      throw new Error('La descripción es obligatoria');
    }

    const montoNumero = Number(monto);

    if (
      monto === null ||
      monto === undefined ||
      monto === '' ||
      !Number.isFinite(montoNumero) ||
      montoNumero <= 0 ||
      !Number.isSafeInteger(Math.round(montoNumero * 100)) ||
      Math.abs(
        montoNumero * 100 - Math.round(montoNumero * 100)
      ) > 1e-7
    ) {
      throw new Error(
        'El monto debe ser positivo y tener máximo dos decimales'
      );
    }

    // 3. Ejecutar la operación dentro de una transacción
    return await sequelize.transaction(async (transaction) => {
      const options = {
        transaction,
        lock: transaction.LOCK.UPDATE
      };

      // 4. Consultar el alquiler para conocer su reserva
      // Esta primera consulta no bloquea el alquiler
      const alquilerInicial =
        await this.alquilerRepository.buscarPorId(
          id,
          { transaction }
        );

      if (!alquilerInicial) {
        throw new Error('El alquiler no existe');
      }

      if (!alquilerInicial.reserva_id) {
        throw new Error(
          'El alquiler no tiene una reserva asociada'
        );
      }

      // 5. Bloquear primero la reserva
      const reserva =
        await ReservaRepository.buscarPorIdTransaccional(
          alquilerInicial.reserva_id,
          options
        );

      if (!reserva) {
        throw new Error('La reserva asociada no existe');
      }

      // 6. Bloquear después el alquiler
      // y consultar nuevamente sus datos
      const alquiler =
        await this.alquilerRepository.buscarPorId(
          id,
          options
        );

      if (!alquiler) {
        throw new Error('El alquiler no existe');
      }

      // Comprobar que la asociación no haya cambiado
      if (
        Number(alquiler.reserva_id) !== Number(reserva.id)
      ) {
        throw new Error(
          'El estado de la reserva no permite registrar cargos adicionales'
        );
      }

      // 7. Validar el estado del alquiler
      if (!['ACTIVO', 'FINALIZADO'].includes(alquiler.estado)) {
        throw new Error(
          'No se pueden registrar cargos en este alquiler'
        );
      }

      // 8. Impedir cargos en reservas cerradas
      if (reserva.estado === 'FINALIZADA') {
        throw new Error(
          'No se pueden registrar cargos en una reserva finalizada'
        );
      }

      // 9. Verificar estados compatibles
      const estadoPermitido =
        (alquiler.estado === 'ACTIVO' &&
          reserva.estado === 'ENTREGADA') ||
        (alquiler.estado === 'FINALIZADO' &&
          reserva.estado === 'DEVUELTA');

      if (!estadoPermitido) {
        throw new Error(
          'El estado de la reserva no permite registrar cargos adicionales'
        );
      }

      // 10. Registrar el cargo adicional
      const cargo = await this.cargoAdicionalRepository.crear(
        {
          alquiler_id: id,
          tipo,
          descripcion: descripcion.trim(),
          monto: montoNumero
        },
        { transaction }
      );

      // 11. Retornar el cargo registrado
      return cargo;
    });
  }
}

export default RegistrarCargoAdicional;
