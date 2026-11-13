
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';

import CargoAdicionalRepository from '../../infrastructure/repositories/CargoAdicionalRepository.js';

import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';

class HistorialAlquileresController {
  async listar(req, res) {
    try {
      // 1. Obtener alquileres finalizados
      const alquileres = await AlquileresRepository.listarPorEstado(
        'FINALIZADO'
      );

      // 2. Agregar información a cada alquiler
      const historial = await Promise.all(
        alquileres.map(async (alquiler) => {

          // Consultar la reserva asociada
          const reserva = alquiler.reserva_id
            ? await ReservaRepository.buscarPorIdTransaccional(
                alquiler.reserva_id
              )
            : null;

          // Consultar los cargos del alquiler
          const cargos = await CargoAdicionalRepository.listarPorAlquiler(
            alquiler.id
          );

          // Calcular el total de cargos
          const totalCargos =
            await CargoAdicionalRepository.calcularTotal(
              alquiler.id
            );

          // Monto original del alquiler
          const montoAlquiler = Number(alquiler.monto_total || 0);

          // Calcular el total final
          const totalFinal = Math.round(
            (montoAlquiler + totalCargos) * 100
          ) / 100;

          return {
            ...alquiler,

            // Nuevo campo: estado de la reserva
            estado_reserva: reserva?.estado ?? null,

            monto_alquiler: montoAlquiler,

            total_cargos: totalCargos,

            total_final: totalFinal,

            cargos_adicionales: cargos.map((cargo) => ({
              id: cargo.id,
              tipo: cargo.tipo,
              descripcion: cargo.descripcion,
              monto: Number(cargo.monto),
              fecha_cargo: cargo.fecha_cargo
            }))
          };
        })
      );

      // 3. Responder con el historial completo
      return res.status(200).json({
        mensaje: 'Historial de alquileres obtenido correctamente',
        total: historial.length,
        alquileres: historial
      });

    } catch (error) {
      console.error('Error al obtener historial de alquileres:', error);

      return res.status(500).json({
        mensaje: 'No se pudo obtener el historial de alquileres'
      });
    }
  }
}

export default new HistorialAlquileresController();
