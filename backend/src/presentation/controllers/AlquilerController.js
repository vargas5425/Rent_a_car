import { crearAlquilerDesdeReserva } from '../../application/alquileres/CrearAlquilerDesdeReserva.js';
import { registrarEntrega } from '../../application/alquileres/RegistrarEntrega.js';
import { registrarDevolucion } from '../../application/alquileres/RegistrarDevolucion.js';
import { obtenerAlquilerPorId } from '../../application/alquileres/ObtenerAlquilerPorId.js';
import ObtenerAlquileresPendientes from '../../application/alquileres/ObtenerAlquileresPendientes.js';
import ObtenerAlquileresActivos from '../../application/alquileres/ObtenerAlquileresActivos.js';
import RegistrarCargoAdicional from '../../application/alquileres/RegistrarCargoAdicional.js';

import alquilerRepo from '../../infrastructure/repositories/AlquileresRepository.js';
import cargoRepo from '../../infrastructure/repositories/CargoAdicionalRepository.js';
import reservaRepo from '../../infrastructure/repositories/ReservaRepository.js';
import pagoRepo from '../../infrastructure/repositories/PagoRepository.js';

const pendientesService = new ObtenerAlquileresPendientes(alquilerRepo);
const activosService = new ObtenerAlquileresActivos(alquilerRepo);
const cargoService = new RegistrarCargoAdicional(alquilerRepo, cargoRepo);

function responderError(res, error) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message, codigo: error.codigo });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Esta reserva ya tiene un alquiler asociado' });
  }
  if (error instanceof Error && error.message) {
    const msg = error.message.toLowerCase();
    const esConflicto =
      msg.includes('no permite') ||
      msg.includes('finalizada') ||
      msg.includes('no se pueden registrar');
    return res.status(esConflicto ? 409 : 400).json({ error: error.message });
  }
  console.error('Error en AlquilerController:', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function adjuntarResumenPagos(alquiler) {
  const montoTotal = Number(alquiler.monto_total || 0);
  const depositoGarantia = Number(alquiler.deposito_garantia || 0);
  const totalPagado = await pagoRepo.calcularTotalPagado(alquiler.id);
  const pagos = await pagoRepo.listarPorAlquiler(alquiler.id);
  const saldoPendiente = Math.max(
    0,
    Math.round((montoTotal - totalPagado - depositoGarantia) * 100) / 100
  );

  return {
    ...alquiler,
    monto_total: montoTotal,
    deposito_garantia: depositoGarantia,
    total_pagado: totalPagado,
    saldo_pendiente: saldoPendiente,
    pagos
  };
}

export async function postCrearAlquiler(req, res) {
  try {
    const { reservaId } = req.body;
    const alquiler = await crearAlquilerDesdeReserva(reservaId);
    res.status(201).json({ mensaje: 'Alquiler creado correctamente', alquiler });
  } catch (error) {
    responderError(res, error);
  }
}

export async function getPendientes(req, res) {
  try {
    const alquileres = await pendientesService.ejecutar();
    res.status(200).json({ mensaje: 'Alquileres pendientes', total: alquileres.length, alquileres });
  } catch (error) {
    responderError(res, error);
  }
}

export async function getActivos(req, res) {
  try {
    const alquileres = await activosService.ejecutar();
    res.status(200).json({ mensaje: 'Alquileres activos', total: alquileres.length, alquileres });
  } catch (error) {
    responderError(res, error);
  }
}

// GET /alquileres/:id
export async function getPorId(req, res) {
  try {
    const alquiler = await obtenerAlquilerPorId(req.params.id, req.usuario);
    const alquilerConPagos = await adjuntarResumenPagos(alquiler);
    res.status(200).json({ alquiler: alquilerConPagos });
  } catch (error) {
    responderError(res, error);
  }
}

export async function patchEntrega(req, res) {
  try {
    const resultado = await registrarEntrega(req.params.id, req.body, req.usuario);
    res.status(200).json(resultado);
  } catch (error) {
    responderError(res, error);
  }
}

export async function patchDevolucion(req, res) {
  try {
    const resultado = await registrarDevolucion(req.params.id, req.body);
    res.status(200).json(resultado);
  } catch (error) {
    responderError(res, error);
  }
}

export async function postCargo(req, res) {
  try {
    const cargo = await cargoService.ejecutar(req.params.id, req.body);
    res.status(201).json({ mensaje: 'Cargo adicional registrado correctamente', cargo });
  } catch (error) {
    responderError(res, error);
  }
}

export async function getHistorial(req, res) {
  try {
    const alquileres = await alquilerRepo.listarPorEstado('FINALIZADO');

    const historial = await Promise.all(
      alquileres.map(async (alquiler) => {
        const reserva = alquiler.reserva_id
          ? await reservaRepo.buscarPorIdTransaccional(alquiler.reserva_id)
          : null;

        const cargos = await cargoRepo.listarPorAlquiler(alquiler.id);
        const totalCargos = await cargoRepo.calcularTotal(alquiler.id);

        // El monto_total YA incluye los cargos, no sumamos de nuevo
        const montoAlquiler = Number(alquiler.monto_total || 0);
        const depositoGarantia = Number(alquiler.deposito_garantia || 0);
        const totalPagado = await pagoRepo.calcularTotalPagado(alquiler.id);
        const pagos = await pagoRepo.listarPorAlquiler(alquiler.id);
        const saldoPendiente = Math.max(
          0,
          Math.round((montoAlquiler - totalPagado - depositoGarantia) * 100) / 100
        );

        return {
          ...alquiler,
          estado_reserva: reserva?.estado ?? null,
          monto_alquiler: montoAlquiler,
          deposito_garantia: depositoGarantia,
          total_cargos: totalCargos, // Solo informativo
          total_final: montoAlquiler, // El total real es monto_total
          total_pagado: totalPagado,
          saldo_pendiente: saldoPendiente,
          pagos,
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

    res.status(200).json({
      mensaje: 'Historial de alquileres obtenido correctamente',
      total: historial.length,
      alquileres: historial
    });
  } catch (error) {
    responderError(res, error);
  }
}