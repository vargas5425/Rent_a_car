import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../infrastructure/models/index.js', () => ({
  sequelize: { transaction: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/AlquileresRepository.js', () => ({
  default: {
    buscarPorId: vi.fn(),
    existeOtroAlquilerActivo: vi.fn(),
    registrarEntrega: vi.fn()
  }
}));
vi.mock('../../infrastructure/repositories/VehiculoRepository.js', () => ({
  default: { findById: vi.fn(), update: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/ReservaRepository.js', () => ({
  default: { buscarPorIdTransaccional: vi.fn(), cambiarEstadoTransaccional: vi.fn() }
}));

import { sequelize } from '../../infrastructure/models/index.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import { registrarEntrega } from './RegistrarEntrega.js';

const HORA = 60 * 60 * 1000;
const AHORA = new Date('2026-12-01T12:00:00.000Z');
const transaccion = { LOCK: { UPDATE: 'UPDATE' } };

const alquilerBase = () => ({
  id: 1,
  reserva_id: 20,
  vehiculo_id: 3,
  usuario_id: 5,
  estado: 'PENDIENTE',
  fecha_entrega: null
});
const vehiculoBase = () => ({ id: 3, activo: true, estado: 'RESERVADA', kilometraje_actual: 10000 });
const reservaBase = () => ({
  id: 20,
  usuario_id: 5,
  vehiculo_id: 3,
  estado: 'CONFIRMADA',
  fecha_inicio: new Date(AHORA.getTime() - HORA)
});
const datosValidos = () => ({ kilometraje_inicial: 15000, combustible_inicial: 80 });
const empleado = { id: 2, nombre: 'Ana', rol: 'EMPLEADO' };

describe('registrarEntrega', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
    vi.clearAllMocks();
    sequelize.transaction.mockImplementation(async (callback) => callback(transaccion));
    AlquileresRepository.buscarPorId.mockResolvedValue(alquilerBase());
    AlquileresRepository.existeOtroAlquilerActivo.mockResolvedValue(false);
    AlquileresRepository.registrarEntrega.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
    VehiculoRepository.findById.mockResolvedValue(vehiculoBase());
    VehiculoRepository.update.mockResolvedValue(true);
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(reservaBase());
    ReservaRepository.cambiarEstadoTransaccional.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validaciones de entrada', () => {
    it.each(['abc', 0, -2])('Rechaza el ID de alquiler inválido %s', async (id) => {
      await expect(registrarEntrega(id, datosValidos())).rejects.toMatchObject({ codigo: 'VALIDACION' });
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it.each([undefined, null, '', -5, 10.5, 'abc'])('Rechaza el kilometraje inicial %s', async (valor) => {
      await expect(registrarEntrega(1, { ...datosValidos(), kilometraje_inicial: valor }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it.each([undefined, null, '', -1, 101, 50.5])('Rechaza el combustible inicial %s', async (valor) => {
      await expect(registrarEntrega(1, { ...datosValidos(), combustible_inicial: valor }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it.each([-10, 'abc', 10.123])('Rechaza el depósito de garantía %s', async (valor) => {
      await expect(registrarEntrega(1, { ...datosValidos(), deposito_garantia: valor }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it('Acepta datos vacíos como objeto por defecto y los rechaza por falta de kilometraje', async () => {
      await expect(registrarEntrega(1)).rejects.toMatchObject({ codigo: 'VALIDACION' });
    });
  });

  describe('reglas de negocio', () => {
    it('Devuelve 404 si el alquiler no existe', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue(null);
      await expect(registrarEntrega(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Devuelve 409 si el alquiler no tiene reserva asociada', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), reserva_id: null });
      await expect(registrarEntrega(1, datosValidos())).rejects.toMatchObject({ status: 409 });
    });

    it('Devuelve 404 si el vehículo no existe', async () => {
      VehiculoRepository.findById.mockResolvedValue(null);
      await expect(registrarEntrega(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Devuelve 404 si el vehículo está inactivo', async () => {
      VehiculoRepository.findById.mockResolvedValue({ ...vehiculoBase(), activo: false });
      await expect(registrarEntrega(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Devuelve 404 si la reserva asociada no existe', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(null);
      await expect(registrarEntrega(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Devuelve 404 si el alquiler desaparece al bloquearlo', async () => {
      AlquileresRepository.buscarPorId
        .mockResolvedValueOnce(alquilerBase())
        .mockResolvedValueOnce(null);
      await expect(registrarEntrega(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Rechaza si el vehículo del alquiler no coincide', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), vehiculo_id: 99 });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('no coinciden con el vehículo');
    });

    it('Rechaza si la reserva del alquiler no coincide', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), id: 21 });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('no coinciden con la reserva');
    });

    it.each(['ACTIVO', 'FINALIZADO', 'CANCELADO'])('Solo entrega alquileres pendientes, no %s', async (estado) => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), estado });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('Solo se pueden entregar alquileres pendientes');
    });

    it('Rechaza si ya existe una entrega registrada', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), fecha_entrega: AHORA });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('ya tiene una entrega registrada');
    });

    it('Exige que la reserva esté confirmada', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), estado: 'RESERVADA' });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('debe estar confirmada');
    });

    it('Rechaza si el cliente de la reserva no coincide con el del alquiler', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), usuario_id: 9 });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('no coinciden con la reserva');
    });

    it('No permite entregar antes de la fecha de inicio', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({
        ...reservaBase(),
        fecha_inicio: new Date(AHORA.getTime() + HORA)
      });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('antes de la fecha de inicio');
    });

    it.each(['ALQUILADA', 'MANTENIMIENTO'])('No entrega un vehículo en estado %s', async (estado) => {
      VehiculoRepository.findById.mockResolvedValue({ ...vehiculoBase(), estado });
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('no está disponible');
    });

    it('Rechaza si el vehículo ya tiene otro alquiler activo', async () => {
      AlquileresRepository.existeOtroAlquilerActivo.mockResolvedValue(true);
      await expect(registrarEntrega(1, datosValidos())).rejects.toThrow('otro alquiler activo');
    });

    it('El kilometraje inicial no puede ser menor al del vehículo', async () => {
      await expect(registrarEntrega(1, { ...datosValidos(), kilometraje_inicial: 5000 }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
      expect(AlquileresRepository.registrarEntrega).not.toHaveBeenCalled();
    });
  });

  describe('entrega exitosa', () => {
    it.each(['DISPONIBLE', 'RESERVADO', 'RESERVADA'])('Acepta vehículos en estado %s', async (estado) => {
      VehiculoRepository.findById.mockResolvedValue({ ...vehiculoBase(), estado });
      const resultado = await registrarEntrega(1, datosValidos(), empleado);
      expect(resultado.mensaje).toBe('Entrega registrada correctamente');
    });

    it('Registra la entrega, marca la reserva ENTREGADA y el vehículo ALQUILADA', async () => {
      const resultado = await registrarEntrega('1', datosValidos(), empleado);

      expect(AlquileresRepository.registrarEntrega).toHaveBeenCalledWith(
        1,
        {
          fecha_entrega: AHORA,
          kilometraje_inicial: 15000,
          combustible_inicial: 80,
          observaciones_entrega: null,
          empleado_entrega_id: 2,
          deposito_garantia: 0
        },
        { transaction: transaccion }
      );
      expect(ReservaRepository.cambiarEstadoTransaccional)
        .toHaveBeenCalledWith(20, 'ENTREGADA', { transaction: transaccion });
      expect(VehiculoRepository.update)
        .toHaveBeenCalledWith(3, { estado: 'ALQUILADA', kilometraje_actual: 15000 }, { transaction: transaccion });
      expect(resultado.reserva).toEqual({ id: 20, estado: 'ENTREGADA' });
      expect(resultado.vehiculo).toEqual({ id: 3, estado: 'ALQUILADA' });
      expect(resultado.responsable).toEqual({ id: 2, nombre: 'Ana', rol: 'EMPLEADO' });
    });

    it('Guarda el depósito y limpia las observaciones', async () => {
      await registrarEntrega(1, {
        ...datosValidos(),
        deposito_garantia: '150.50',
        observaciones_entrega: '  Rayón leve  '
      }, empleado);

      expect(AlquileresRepository.registrarEntrega).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ deposito_garantia: 150.5, observaciones_entrega: 'Rayón leve' }),
        { transaction: transaccion }
      );
    });

    it('Permite registrar la entrega sin responsable', async () => {
      const resultado = await registrarEntrega(1, datosValidos());

      expect(AlquileresRepository.registrarEntrega).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ empleado_entrega_id: null }),
        { transaction: transaccion }
      );
      expect(resultado.responsable).toBeNull();
    });
  });
});
