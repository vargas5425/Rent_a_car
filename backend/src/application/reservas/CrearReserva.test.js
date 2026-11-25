import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../infrastructure/repositories/TarifaRepository.js', () => ({
  default: {
    buscarPorVehiculo: vi.fn(),
    buscarPorCategoria: vi.fn()
  }
}));

import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';
import { construirCrearReserva } from './CrearReserva.js';
import { ReservaError } from '../../domain/reservas/ReservaError.js';

const HORA = 60 * 60 * 1000;
const BASE = Date.now();
const enHoras = (n) => new Date(BASE + n * HORA).toISOString();

const vehiculoBase = { id: 1, categoria_id: 2, estado: 'DISPONIBLE', activo: true };

describe('CrearReserva', () => {
  let reservaRepo;
  let vehiculoRepo;
  let crearReserva;

  const datosValidos = () => ({
    usuarioId: 7,
    vehiculoId: 1,
    fechaInicio: enHoras(2),
    fechaFin: enHoras(5),
    modalidad: 'HORA'
  });

  beforeEach(() => {
    vi.clearAllMocks();
    reservaRepo = { crearSiDisponible: vi.fn() };
    vehiculoRepo = { findById: vi.fn(), update: vi.fn() };
    vehiculoRepo.findById.mockResolvedValue(vehiculoBase);
    vehiculoRepo.update.mockResolvedValue(true);
    TarifaRepository.buscarPorVehiculo.mockResolvedValue([{ id: 10, modalidad: 'HORA', precio: 40 }]);
    TarifaRepository.buscarPorCategoria.mockResolvedValue([]);
    crearReserva = construirCrearReserva({ reservaRepo, vehiculoRepo });
  });

  it('Rechaza la solicitud si faltan campos obligatorios', async () => {
    const datos = { ...datosValidos(), vehiculoId: undefined };
    await expect(crearReserva(datos)).rejects.toBeInstanceOf(ReservaError);
    await expect(crearReserva(datos)).rejects.toMatchObject({ codigo: 'VALIDACION', status: 400 });
    expect(reservaRepo.crearSiDisponible).not.toHaveBeenCalled();
  });

  it('Rechaza una modalidad no soportada', async () => {
    await expect(crearReserva({ ...datosValidos(), modalidad: 'SEMANA' }))
      .rejects.toMatchObject({ codigo: 'VALIDACION' });
  });

  it('Rechaza fechas en el pasado', async () => {
    const datos = { ...datosValidos(), fechaInicio: enHoras(-5), fechaFin: enHoras(-2) };
    await expect(crearReserva(datos)).rejects.toMatchObject({ codigo: 'VALIDACION' });
  });

  it('Rechaza si la fecha de fin no es posterior a la de inicio', async () => {
    const datos = { ...datosValidos(), fechaInicio: enHoras(5), fechaFin: enHoras(2) };
    await expect(crearReserva(datos)).rejects.toMatchObject({ codigo: 'VALIDACION' });
  });

  it('Devuelve 404 si el vehículo no existe', async () => {
    vehiculoRepo.findById.mockResolvedValue(null);
    await expect(crearReserva(datosValidos()))
      .rejects.toMatchObject({ codigo: 'NO_ENCONTRADA', status: 404 });
  });

  it('Devuelve 404 si el vehículo está dado de baja', async () => {
    vehiculoRepo.findById.mockResolvedValue({ ...vehiculoBase, activo: false });
    await expect(crearReserva(datosValidos())).rejects.toMatchObject({ status: 404 });
  });

  it('Devuelve 409 si el vehículo está en mantenimiento', async () => {
    vehiculoRepo.findById.mockResolvedValue({ ...vehiculoBase, estado: 'MANTENIMIENTO' });
    await expect(crearReserva(datosValidos()))
      .rejects.toMatchObject({ codigo: 'CONFLICTO', status: 409 });
    expect(reservaRepo.crearSiDisponible).not.toHaveBeenCalled();
  });

  it('Falla si no hay tarifa para el vehículo ni para su categoría', async () => {
    TarifaRepository.buscarPorVehiculo.mockResolvedValue([]);
    TarifaRepository.buscarPorCategoria.mockResolvedValue([]);
    await expect(crearReserva(datosValidos())).rejects.toThrow('No hay tarifa configurada');
  });

  it('Crea la reserva con la tarifa del vehículo y calcula el total', async () => {
    const reservaCreada = { id: 99, estado: 'RESERVADA' };
    reservaRepo.crearSiDisponible.mockResolvedValue(reservaCreada);

    const resultado = await crearReserva(datosValidos());

    expect(resultado).toBe(reservaCreada);
    expect(reservaRepo.crearSiDisponible).toHaveBeenCalledWith(expect.objectContaining({
      usuario_id: 7,
      vehiculo_id: 1,
      modalidad: 'HORA',
      precio_unitario: 40,
      total: 120,
      estado: 'RESERVADA'
    }));
    expect(vehiculoRepo.update).toHaveBeenCalledWith(1, { estado: 'RESERVADA' });
  });

  it('Cobra por días completos cuando la modalidad es DIA', async () => {
    TarifaRepository.buscarPorVehiculo.mockResolvedValue([{ id: 11, modalidad: 'DIA', precio: 300 }]);
    reservaRepo.crearSiDisponible.mockResolvedValue({ id: 100 });

    await crearReserva({
      ...datosValidos(),
      fechaInicio: enHoras(1),
      fechaFin: enHoras(49),
      modalidad: 'DIA'
    });

    expect(reservaRepo.crearSiDisponible).toHaveBeenCalledWith(expect.objectContaining({
      precio_unitario: 300,
      total: 600
    }));
  });

  it('Usa la tarifa de la categoría cuando el vehículo no tiene una propia', async () => {
    TarifaRepository.buscarPorVehiculo.mockResolvedValue([]);
    TarifaRepository.buscarPorCategoria.mockResolvedValue([{ id: 12, modalidad: 'HORA', precio: 25 }]);
    reservaRepo.crearSiDisponible.mockResolvedValue({ id: 101 });

    await crearReserva(datosValidos());

    expect(TarifaRepository.buscarPorCategoria).toHaveBeenCalledWith(2);
    expect(reservaRepo.crearSiDisponible).toHaveBeenCalledWith(expect.objectContaining({
      precio_unitario: 25,
      total: 75
    }));
  });

  it('Rechaza si el cálculo de tarifa no produce un monto válido', async () => {
    TarifaRepository.buscarPorVehiculo.mockResolvedValue([{ id: 13, modalidad: 'HORA', precio: 'abc' }]);
    await expect(crearReserva(datosValidos())).rejects.toMatchObject({ codigo: 'VALIDACION' });
    expect(reservaRepo.crearSiDisponible).not.toHaveBeenCalled();
  });

  it('Devuelve 409 si el horario ya está ocupado y no cambia el estado del vehículo', async () => {
    reservaRepo.crearSiDisponible.mockResolvedValue(null);

    await expect(crearReserva(datosValidos()))
      .rejects.toMatchObject({ codigo: 'CONFLICTO', status: 409 });
    expect(vehiculoRepo.update).not.toHaveBeenCalled();
  });
});
