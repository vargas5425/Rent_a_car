import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../infrastructure/models/index.js', () => ({
  sequelize: { transaction: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/AlquileresRepository.js', () => ({
  default: { buscarPorId: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/PagoRepository.js', () => ({
  default: { crear: vi.fn(), calcularTotalPagado: vi.fn() }
}));

import { sequelize } from '../../infrastructure/models/index.js';
import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import PagoRepository from '../../infrastructure/repositories/PagoRepository.js';
import { registrarPago } from './RegistrarPago.js';

const AHORA = new Date('2026-12-01T12:00:00.000Z');
const transaccion = { LOCK: { UPDATE: 'UPDATE' } };

const alquilerBase = () => ({ id: 1, estado: 'ACTIVO', monto_total: '500.00', deposito_garantia: 0 });
const datosValidos = () => ({ monto: 100, tipo: 'ANTICIPO', metodo_pago: 'EFECTIVO' });

describe('registrarPago', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
    vi.clearAllMocks();
    sequelize.transaction.mockImplementation(async (callback) => callback(transaccion));
    AlquileresRepository.buscarPorId.mockResolvedValue(alquilerBase());
    PagoRepository.calcularTotalPagado.mockResolvedValue(0);
    PagoRepository.crear.mockImplementation(async (datos) => ({ id: 9, ...datos }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validaciones de entrada', () => {
    it.each(['abc', 0, -1, 2.5])('Rechaza el ID de alquiler inválido %s', async (id) => {
      await expect(registrarPago(id, datosValidos())).rejects.toMatchObject({ codigo: 'VALIDACION', status: 400 });
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it.each([undefined, null, 0, -5, 'abc'])('Rechaza el monto %s', async (monto) => {
      await expect(registrarPago(1, { ...datosValidos(), monto }))
        .rejects.toThrow('El monto del pago debe ser mayor a 0');
    });

    it('Sin datos rechaza el pago por falta de monto', async () => {
      await expect(registrarPago(1)).rejects.toMatchObject({ codigo: 'VALIDACION' });
    });

    it.each([undefined, '', 'DEPOSITO', 123])('Rechaza el tipo de pago %s', async (tipo) => {
      await expect(registrarPago(1, { ...datosValidos(), tipo }))
        .rejects.toThrow('El tipo de pago debe ser ANTICIPO, PAGO_PARCIAL o TOTAL');
    });

    it.each([undefined, '', '   ', 5])('Exige el método de pago (%s)', async (metodo_pago) => {
      await expect(registrarPago(1, { ...datosValidos(), metodo_pago }))
        .rejects.toThrow('Debes indicar el método de pago');
    });

    it('Rechaza una fecha de pago inválida', async () => {
      await expect(registrarPago(1, { ...datosValidos(), fecha_pago: 'no-es-fecha' }))
        .rejects.toThrow('La fecha de pago no es válida');
    });
  });

  describe('reglas de negocio', () => {
    it('Devuelve 404 si el alquiler no existe', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue(null);
      await expect(registrarPago(1, datosValidos())).rejects.toMatchObject({ codigo: 'NO_ENCONTRADA', status: 404 });
    });

    it('No permite pagos en un alquiler cancelado', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), estado: 'CANCELADO' });
      await expect(registrarPago(1, datosValidos())).rejects.toMatchObject({ codigo: 'CONFLICTO', status: 409 });
      expect(PagoRepository.crear).not.toHaveBeenCalled();
    });

    it('Rechaza el pago si el alquiler ya está totalmente pagado', async () => {
      PagoRepository.calcularTotalPagado.mockResolvedValue(500);
      await expect(registrarPago(1, datosValidos())).rejects.toThrow('ya no tiene saldo pendiente');
    });

    it('Rechaza el pago si el depósito de garantía cubre todo el monto', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), deposito_garantia: 500 });
      await expect(registrarPago(1, datosValidos())).rejects.toThrow('ya no tiene saldo pendiente');
    });

    it('Trata un alquiler sin monto total como sin saldo pendiente', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), monto_total: null, deposito_garantia: null });
      await expect(registrarPago(1, datosValidos())).rejects.toMatchObject({ codigo: 'CONFLICTO' });
    });

    it('Rechaza un monto que excede el saldo pendiente e informa ambos valores', async () => {
      PagoRepository.calcularTotalPagado.mockResolvedValue(200);
      const intento = registrarPago(1, { ...datosValidos(), monto: 350 });

      await expect(intento).rejects.toMatchObject({ codigo: 'VALIDACION' });
      await expect(intento).rejects.toThrow('350.00');
      await expect(intento).rejects.toThrow('300.00');
      expect(PagoRepository.crear).not.toHaveBeenCalled();
    });
  });

  describe('pago exitoso', () => {
    it('Registra el pago normalizando tipo y método, y calcula el resumen', async () => {
      AlquileresRepository.buscarPorId.mockResolvedValue({ ...alquilerBase(), deposito_garantia: 50 });
      PagoRepository.calcularTotalPagado.mockResolvedValue(200);

      const resultado = await registrarPago('1', { monto: '100', tipo: ' anticipo ', metodo_pago: ' efectivo ' });

      expect(PagoRepository.crear).toHaveBeenCalledWith(
        { alquiler_id: 1, monto: 100, metodo_pago: 'EFECTIVO', fecha_pago: AHORA, tipo: 'ANTICIPO' },
        { transaction: transaccion }
      );
      expect(resultado.mensaje).toBe('Pago registrado correctamente');
      expect(resultado.pago.id).toBe(9);
      expect(resultado.resumen_pagos).toEqual({
        alquiler_id: 1,
        monto_total: 500,
        deposito_garantia: 50,
        total_pagado: 300,
        saldo_pendiente: 150
      });
    });

    it('Un pago que iguala el saldo deja el saldo pendiente en cero', async () => {
      PagoRepository.calcularTotalPagado.mockResolvedValue(250);

      const resultado = await registrarPago(1, { monto: 250, tipo: 'TOTAL', metodo_pago: 'TARJETA' });

      expect(resultado.resumen_pagos.total_pagado).toBe(500);
      expect(resultado.resumen_pagos.saldo_pendiente).toBe(0);
    });

    it('Respeta la fecha de pago indicada', async () => {
      await registrarPago(1, { ...datosValidos(), fecha_pago: '2026-11-30T10:00:00.000Z' });

      expect(PagoRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({ fecha_pago: new Date('2026-11-30T10:00:00.000Z') }),
        { transaction: transaccion }
      );
    });

    it('Usa la fecha actual cuando la fecha de pago viene vacía', async () => {
      await registrarPago(1, { ...datosValidos(), fecha_pago: '' });

      expect(PagoRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({ fecha_pago: AHORA }),
        { transaction: transaccion }
      );
    });

    it('Redondea el monto a dos decimales', async () => {
      await registrarPago(1, { ...datosValidos(), monto: '99.999' });

      expect(PagoRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({ monto: 100 }),
        { transaction: transaccion }
      );
    });

    it.each(['ANTICIPO', 'PAGO_PARCIAL', 'TOTAL'])('Acepta el tipo de pago %s', async (tipo) => {
      await expect(registrarPago(1, { ...datosValidos(), tipo })).resolves.toMatchObject({ pago: { tipo } });
    });
  });
});
