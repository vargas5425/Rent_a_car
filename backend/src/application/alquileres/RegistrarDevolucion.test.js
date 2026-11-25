import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../infrastructure/models/index.js', () => ({
  sequelize: { transaction: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/AlquileresRepository.js', () => ({
  default: {
    buscarPorId: vi.fn(),
    existeOtroAlquilerActivo: vi.fn(),
    registrarDevolucion: vi.fn(),
    actualizarMontoTotal: vi.fn()
  }
}));
vi.mock('../../infrastructure/repositories/VehiculoRepository.js', () => ({
  default: { findById: vi.fn(), update: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/CargoAdicionalRepository.js', () => ({
  default: { crear: vi.fn(), calcularTotal: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/ReservaRepository.js', () => ({
  default: { buscarPorIdTransaccional: vi.fn(), cambiarEstadoTransaccional: vi.fn() }
}));

import { sequelize } from '../../infrastructure/models/index.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import CargoAdicionalRepository from '../../infrastructure/repositories/CargoAdicionalRepository.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import { registrarDevolucion } from './RegistrarDevolucion.js';

const HORA = 60 * 60 * 1000;
const AHORA = new Date('2026-12-01T12:00:00.000Z');
const transaccion = { LOCK: { UPDATE: 'UPDATE' } };
const hace = (horas) => new Date(AHORA.getTime() - horas * HORA);

const alquilerBase = () => ({
  id: 1,
  reserva_id: 20,
  vehiculo_id: 3,
  usuario_id: 5,
  estado: 'ACTIVO',
  fecha_entrega: hace(2),
  fecha_devolucion: null,
  fecha_fin: new Date(AHORA.getTime() + 5 * HORA),
  modalidad: 'HORA',
  precio_unitario: 40,
  tarifa_diaria: null,
  kilometraje_inicial: 15000,
  combustible_inicial: 80,
  monto_total: '120.00',
  deposito_garantia: 0
});
const vehiculoBase = () => ({ id: 3, estado: 'ALQUILADA' });
const reservaBase = () => ({ id: 20, usuario_id: 5, vehiculo_id: 3, estado: 'ENTREGADA' });
const datosValidos = () => ({
  kilometraje_final: 15500,
  combustible_final: 80,
  requiere_mantenimiento: false,
  observaciones_devolucion: 'Sin novedades'
});

describe('registrarDevolucion', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
    vi.clearAllMocks();
    sequelize.transaction.mockImplementation(async (callback) => callback(transaccion));
    AlquileresRepository.buscarPorId.mockResolvedValue(alquilerBase());
    AlquileresRepository.existeOtroAlquilerActivo.mockResolvedValue(false);
    AlquileresRepository.registrarDevolucion.mockResolvedValue({ id: 1, estado: 'FINALIZADO' });
    AlquileresRepository.actualizarMontoTotal.mockResolvedValue(true);
    VehiculoRepository.findById.mockResolvedValue(vehiculoBase());
    VehiculoRepository.update.mockResolvedValue(true);
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(reservaBase());
    ReservaRepository.cambiarEstadoTransaccional.mockResolvedValue(true);
    CargoAdicionalRepository.crear.mockImplementation(async (datos) => ({ id: 1, ...datos }));
    CargoAdicionalRepository.calcularTotal.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validaciones de entrada', () => {
    it.each(['abc', 0, -3])('Rechaza el ID de alquiler inválido %s', async (id) => {
      await expect(registrarDevolucion(id, datosValidos())).rejects.toMatchObject({ codigo: 'VALIDACION' });
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it.each([undefined, null, '', -1, 12.5, 'abc'])('Rechaza el kilometraje final %s', async (valor) => {
      await expect(registrarDevolucion(1, { ...datosValidos(), kilometraje_final: valor }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it.each([undefined, null, '', -1, 101, 30.5])('Rechaza el combustible final %s', async (valor) => {
      await expect(registrarDevolucion(1, { ...datosValidos(), combustible_final: valor }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it.each([undefined, 'si', 1])('Exige un booleano en requiere_mantenimiento (%s)', async (valor) => {
      await expect(registrarDevolucion(1, { ...datosValidos(), requiere_mantenimiento: valor }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it.each([undefined, '', '   ', 123])('Exige observaciones de devolución (%s)', async (valor) => {
      await expect(registrarDevolucion(1, { ...datosValidos(), observaciones_devolucion: valor }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });
  });

  describe('reglas de negocio', () => {
    it('Devuelve 404 si el alquiler no existe', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue(null);
      await expect(registrarDevolucion(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Devuelve 409 si el alquiler no tiene reserva asociada', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), reserva_id: null });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toMatchObject({ status: 409 });
    });

    it('Devuelve 404 si el vehículo no existe', async () => {
      VehiculoRepository.findById.mockResolvedValue(null);
      await expect(registrarDevolucion(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Devuelve 404 si la reserva asociada no existe', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(null);
      await expect(registrarDevolucion(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Devuelve 404 si el alquiler desaparece al bloquearlo', async () => {
      AlquileresRepository.buscarPorId
        .mockResolvedValueOnce(alquilerBase())
        .mockResolvedValueOnce(null);
      await expect(registrarDevolucion(1, datosValidos())).rejects.toMatchObject({ status: 404 });
    });

    it('Rechaza si el vehículo del alquiler no coincide', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), vehiculo_id: 99 });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('no coinciden con el vehículo');
    });

    it('Rechaza si la reserva del alquiler no coincide', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), id: 21 });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('no coinciden con la reserva');
    });

    it.each(['PENDIENTE', 'FINALIZADO', 'CANCELADO'])('Solo devuelve alquileres activos, no %s', async (estado) => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), estado });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('Solo se pueden devolver alquileres activos');
    });

    it('Exige que la reserva esté entregada', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), estado: 'CONFIRMADA' });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('debe estar entregada');
    });

    it('Rechaza si el cliente de la reserva no coincide con el del alquiler', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), usuario_id: 9 });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('no coinciden con la reserva');
    });

    it('Rechaza devolver un vehículo que nunca se entregó', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), fecha_entrega: null });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('no fue entregado');
    });

    it('Rechaza si la devolución ya fue registrada', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), fecha_devolucion: AHORA });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('ya tiene una devolución registrada');
    });

    it('El kilometraje final no puede ser menor al inicial', async () => {
      await expect(registrarDevolucion(1, { ...datosValidos(), kilometraje_final: 14000 }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it('Exige que el vehículo esté en estado ALQUILADA', async () => {
      VehiculoRepository.findById.mockResolvedValue({ ...vehiculoBase(), estado: 'DISPONIBLE' });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('estado ALQUILADA');
    });

    it('La devolución no puede ser anterior a la entrega', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({
        ...alquilerBase(),
        fecha_entrega: new Date(AHORA.getTime() + HORA)
      });
      await expect(registrarDevolucion(1, datosValidos())).rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it('No libera el vehículo si tiene otro alquiler activo', async () => {
      AlquileresRepository.existeOtroAlquilerActivo.mockResolvedValue(true);
      await expect(registrarDevolucion(1, datosValidos())).rejects.toThrow('otro alquiler activo');
      expect(VehiculoRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('devolución exitosa', () => {
    it('Sin retraso ni combustible faltante no genera cargos y libera el vehículo', async () => {
      const resultado = await registrarDevolucion('1', datosValidos());

      expect(CargoAdicionalRepository.crear).not.toHaveBeenCalled();
      expect(AlquileresRepository.actualizarMontoTotal).not.toHaveBeenCalled();
      expect(AlquileresRepository.registrarDevolucion).toHaveBeenCalledWith(
        1,
        {
          fecha_devolucion: AHORA,
          kilometraje_final: 15500,
          combustible_final: 80,
          observaciones_devolucion: 'Sin novedades'
        },
        { transaction: transaccion }
      );
      expect(VehiculoRepository.update).toHaveBeenCalledWith(
        3,
        { kilometraje_actual: 15500, estado: 'DISPONIBLE' },
        { transaction: transaccion }
      );
      expect(ReservaRepository.cambiarEstadoTransaccional)
        .toHaveBeenCalledWith(20, 'DEVUELTA', { transaction: transaccion });
      expect(resultado.mensaje).toBe('Devolución registrada correctamente');
      expect(resultado.cargos_generados).toEqual([]);
      expect(resultado.monto_base).toBe(120);
      expect(resultado.monto_total_final).toBe(120);
      expect(resultado.saldo_a_pagar).toBe(120);
      expect(resultado.reserva).toEqual({ id: 20, estado: 'DEVUELTA' });
    });

    it('Envía el vehículo a mantenimiento cuando se solicita', async () => {
      const resultado = await registrarDevolucion(1, { ...datosValidos(), requiere_mantenimiento: true });

      expect(VehiculoRepository.update).toHaveBeenCalledWith(
        3,
        { kilometraje_actual: 15500, estado: 'MANTENIMIENTO' },
        { transaction: transaccion }
      );
      expect(resultado.vehiculo.estado).toBe('MANTENIMIENTO');
    });

    it('Genera cargos por retraso, combustible y manuales, e ignora los inválidos', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({
        ...alquilerBase(),
        fecha_entrega: hace(5),
        fecha_fin: hace(2),
        deposito_garantia: 100
      });
      CargoAdicionalRepository.calcularTotal.mockResolvedValue(210);

      const resultado = await registrarDevolucion(1, {
        ...datosValidos(),
        combustible_final: 30,
        cargos_manuales: [
          { tipo: 'DANIO', descripcion: 'Rayón', monto: '30' },
          { tipo: 'OTRO', descripcion: 'Sin importe', monto: 0 },
          { tipo: 'OTRO', descripcion: 'Importe inválido', monto: 'x' }
        ]
      });

      expect(CargoAdicionalRepository.crear).toHaveBeenCalledTimes(3);
      expect(CargoAdicionalRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({ alquiler_id: 1, tipo: 'RETRASO', monto: 80 }),
        { transaction: transaccion }
      );
      expect(CargoAdicionalRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({ alquiler_id: 1, tipo: 'COMBUSTIBLE', monto: 100 }),
        { transaction: transaccion }
      );
      expect(CargoAdicionalRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({ alquiler_id: 1, tipo: 'DANIO', descripcion: 'Rayón', monto: 30 }),
        { transaction: transaccion }
      );
      expect(AlquileresRepository.actualizarMontoTotal).toHaveBeenCalledWith(1, 330, { transaction: transaccion });
      expect(resultado.retraso).toEqual({ horas_retraso: 2, monto: 80 });
      expect(resultado.combustible.monto).toBe(100);
      expect(resultado.cargos_generados).toHaveLength(3);
      expect(resultado.alquiler.monto_total).toBe(330);
      expect(resultado.monto_total_final).toBe(330);
      expect(resultado.deposito_garantia).toBe(100);
      expect(resultado.saldo_a_pagar).toBe(230);
    });

    it('Usa tipo OTRO y una descripción por defecto en cargos manuales incompletos', async () => {
      await registrarDevolucion(1, { ...datosValidos(), cargos_manuales: [{ monto: 15 }] });

      expect(CargoAdicionalRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'OTRO', descripcion: 'Cargo adicional', monto: 15 }),
        { transaction: transaccion }
      );
    });

    it('Ignora cargos_manuales si no es una lista', async () => {
      await registrarDevolucion(1, { ...datosValidos(), cargos_manuales: 'no es lista' });
      expect(CargoAdicionalRepository.crear).not.toHaveBeenCalled();
    });

    it('El saldo a pagar nunca es negativo cuando el depósito supera el total', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), deposito_garantia: 500 });

      const resultado = await registrarDevolucion(1, datosValidos());

      expect(resultado.monto_total_final).toBe(120);
      expect(resultado.saldo_a_pagar).toBe(0);
    });
  });
});
