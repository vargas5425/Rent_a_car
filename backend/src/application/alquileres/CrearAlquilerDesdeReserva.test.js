import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../infrastructure/models/index.js', () => ({
  sequelize: { transaction: vi.fn() },
  VehiculoModel: { findByPk: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/ReservaRepository.js', () => ({
  default: { buscarPorIdTransaccional: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/AlquileresRepository.js', () => ({
  default: { crear: vi.fn() }
}));

import { sequelize, VehiculoModel } from '../../infrastructure/models/index.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import { crearAlquilerDesdeReserva } from './CrearAlquilerDesdeReserva.js';

const transaccion = { LOCK: { UPDATE: 'UPDATE' } };

const reservaBase = () => ({
  id: 20,
  usuario_id: 5,
  vehiculo_id: 3,
  estado: 'CONFIRMADA',
  fecha_inicio: '2026-12-01T10:00:00.000Z',
  fecha_fin: '2026-12-03T10:00:00.000Z',
  modalidad: 'DIA',
  precio_unitario: '300.00',
  total: '600.00'
});

describe('crearAlquilerDesdeReserva', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sequelize.transaction.mockImplementation(async (callback) => callback(transaccion));
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(reservaBase());
    VehiculoModel.findByPk.mockResolvedValue({ id: 3, activo: true, estado: 'RESERVADA' });
    AlquileresRepository.crear.mockImplementation(async (datos) => ({ id: 1, ...datos }));
  });

  it.each(['abc', 0, -1, 1.5])('Rechaza el ID de reserva inválido %s', async (id) => {
    await expect(crearAlquilerDesdeReserva(id)).rejects.toThrow('El ID de la reserva no es válido');
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('Falla si la reserva no existe', async () => {
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(null);
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('La reserva no existe');
  });

  it('Falla si el vehículo no existe', async () => {
    VehiculoModel.findByPk.mockResolvedValue(null);
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('El vehículo no existe o está inactivo');
  });

  it('Falla si el vehículo está inactivo', async () => {
    VehiculoModel.findByPk.mockResolvedValue({ id: 3, activo: false, estado: 'DISPONIBLE' });
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('El vehículo no existe o está inactivo');
  });

  it('Falla si el vehículo está en mantenimiento', async () => {
    VehiculoModel.findByPk.mockResolvedValue({ id: 3, activo: true, estado: 'MANTENIMIENTO' });
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('El vehículo está en mantenimiento');
  });

  it('Falla si la reserva desaparece al bloquearla', async () => {
    ReservaRepository.buscarPorIdTransaccional
      .mockResolvedValueOnce(reservaBase())
      .mockResolvedValueOnce(null);
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('La reserva no existe');
  });

  it('Falla si el vehículo de la reserva cambió mientras se procesaba', async () => {
    ReservaRepository.buscarPorIdTransaccional
      .mockResolvedValueOnce(reservaBase())
      .mockResolvedValueOnce({ ...reservaBase(), vehiculo_id: 9 });
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('El vehículo asociado a la reserva ha cambiado');
  });

  it.each(['RESERVADA', 'CANCELADA', 'ENTREGADA'])('Rechaza reservas en estado %s', async (estado) => {
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), estado });
    await expect(crearAlquilerDesdeReserva(20))
      .rejects.toThrow('Solo se pueden crear alquileres desde reservas confirmadas');
    expect(AlquileresRepository.crear).not.toHaveBeenCalled();
  });

  it('Rechaza una reserva con precio unitario negativo', async () => {
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), precio_unitario: -1 });
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('Los importes de la reserva no son válidos');
  });

  it('Rechaza una reserva con total no numérico', async () => {
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), total: 'abc' });
    await expect(crearAlquilerDesdeReserva(20)).rejects.toThrow('Los importes de la reserva no son válidos');
  });

  it('Crea un alquiler PENDIENTE con los datos de la reserva por día', async () => {
    const alquiler = await crearAlquilerDesdeReserva('20');

    expect(AlquileresRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        reserva_id: 20,
        usuario_id: 5,
        vehiculo_id: 3,
        modalidad: 'DIA',
        precio_unitario: 300,
        tarifa_diaria: 300,
        monto_total: 600,
        estado: 'PENDIENTE'
      }),
      { transaction: transaccion }
    );
    expect(alquiler.estado).toBe('PENDIENTE');
  });

  it('No define tarifa diaria cuando la modalidad es HORA', async () => {
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({
      ...reservaBase(),
      modalidad: 'HORA',
      precio_unitario: '40.00',
      total: '120.00'
    });

    await crearAlquilerDesdeReserva(20);

    expect(AlquileresRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ modalidad: 'HORA', precio_unitario: 40, tarifa_diaria: null, monto_total: 120 }),
      { transaction: transaccion }
    );
  });
});
