
import { sequelize } from '../../infrastructure/models/index.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';

export async function registrarEntrega(alquilerId, datos) {
  const kilometraje = Number(datos.kilometraje_inicial);
  const combustible = Number(datos.combustible_inicial);

  if (
    !Number.isInteger(kilometraje) ||
    kilometraje < 0
  ) {
    throw new Error('El kilometraje inicial debe ser un entero positivo o cero');
  }

  if (
    !Number.isInteger(combustible) ||
    combustible < 0 ||
    combustible > 100
  ) {
    throw new Error('El combustible inicial debe estar entre 0 y 100');
  }

  return await sequelize.transaction(async (transaction) => {
    // 1. Buscar el alquiler y bloquearlo durante la operación
    const alquiler = await AlquileresRepository.buscarPorId(
      alquilerId,
      {
        transaction,
        lock: transaction.LOCK.UPDATE
      }
    );

    if (!alquiler) {
      throw new Error('El alquiler no existe');
    }

    // 2. Validar que todavía no haya sido entregado
    if (alquiler.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden entregar alquileres pendientes');
    }

    if (alquiler.fecha_entrega) {
      throw new Error('Este alquiler ya tiene una entrega registrada');
    }

    // 3. Buscar y bloquear el vehículo
    const vehiculo = await VehiculoRepository.findById(
      alquiler.vehiculo_id,
      {
        transaction,
        lock: transaction.LOCK.UPDATE
      }
    );

    if (!vehiculo || !vehiculo.activo) {
      throw new Error('El vehículo no existe o está inactivo');
    }

    // El vehículo debe estar reservado para su entrega
    if (vehiculo.estado !== 'RESERVADA') {
      throw new Error('El vehículo debe estar en estado RESERVADA');
    }

    // 4. Evitar registrar un kilometraje menor al actual
    if (kilometraje < Number(vehiculo.kilometraje_actual)) {
      throw new Error(
        'El kilometraje inicial no puede ser menor al kilometraje actual del vehículo'
      );
    }

    // 5. Registrar la entrega del alquiler
    const alquilerActualizado =
      await AlquileresRepository.registrarEntrega(
        alquilerId,
        {
          fecha_entrega: new Date(),
          kilometraje_inicial: kilometraje,
          combustible_inicial: combustible
        },
        { transaction }
      );

    // 6. Actualizar el vehículo
    await VehiculoRepository.update(
      alquiler.vehiculo_id,
      {
        estado: 'ALQUILADA',
        kilometraje_actual: kilometraje
      },
      { transaction }
    );

    // 7. Sequelize confirma la transacción automáticamente
    return alquilerActualizado;
  });
}
