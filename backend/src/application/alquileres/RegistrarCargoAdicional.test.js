import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../infrastructure/models/index.js', () => ({
  sequelize: { transaction: vi.fn() }
}));
vi.mock('../../infrastructure/repositories/ReservaRepository.js', () => ({
  default: { buscarPorIdTransaccional: vi.fn() }
}));

import { sequelize } from '../../infrastructure/models/index.js';
import ReservaRepository from '../../infrastructure/repositories/ReservaRepository.js';
import RegistrarCargoAdicional from './RegistrarCargoAdicional.js';

const transaccion = { LOCK: { UPDATE: 'UPDATE' } };

const alquilerBase = () => ({ id: 1, reserva_id: 20, estado: 'ACTIVO' });
const reservaBase = () => ({ id: 20, estado: 'ENTREGADA' });
const datosValidos = () => ({ tipo: 'DANIO', descripcion: 'Rayón en puerta', monto: 50 });

describe('RegistrarCargoAdicional', () => {
  let alquilerRepo;
  let cargoRepo;
  let caso;

  beforeEach(() => {
    vi.clearAllMocks();
    sequelize.transaction.mockImplementation(async (callback) => callback(transaccion));
    ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(reservaBase());
    alquilerRepo = { buscarPorId: vi.fn().mockResolvedValue(alquilerBase()) };
    cargoRepo = { crear: vi.fn().mockImplementation(async (datos) => ({ id: 7, ...datos })) };
    caso = new RegistrarCargoAdicional(alquilerRepo, cargoRepo);
  });

  describe('validaciones de entrada', () => {
    it.each(['abc', 0, -1, 1.5])('Rechaza el ID de alquiler inválido %s', async (id) => {
      await expect(caso.ejecutar(id, datosValidos())).rejects.toThrow('El ID del alquiler no es válido');
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it.each([null, undefined, 'texto'])('Exige un objeto de datos (%s)', async (datos) => {
      await expect(caso.ejecutar(1, datos)).rejects.toThrow('Los datos del cargo son obligatorios');
    });

    it.each(['RETRASO', 'COMBUSTIBLE', 'INVENTADO', undefined])('Rechaza el tipo de cargo %s', async (tipo) => {
      await expect(caso.ejecutar(1, { ...datosValidos(), tipo })).rejects.toThrow('El tipo de cargo no es válido');
    });

    it.each(['DANIO', 'LIMPIEZA', 'KILOMETRAJE', 'OTRO'])('Acepta el tipo de cargo %s', async (tipo) => {
      await expect(caso.ejecutar(1, { ...datosValidos(), tipo })).resolves.toMatchObject({ tipo });
    });

    it.each([undefined, '', '   ', 123])('Exige una descripción (%s)', async (descripcion) => {
      await expect(caso.ejecutar(1, { ...datosValidos(), descripcion })).rejects.toThrow('La descripción es obligatoria');
    });

    it.each([null, undefined, '', 0, -5, 'abc', 10.123])('Rechaza el monto %s', async (monto) => {
      await expect(caso.ejecutar(1, { ...datosValidos(), monto }))
        .rejects.toThrow('El monto debe ser positivo y tener máximo dos decimales');
    });
  });

  describe('reglas de negocio', () => {
    it('Falla si el alquiler no existe', async () => {
      alquilerRepo.buscarPorId.mockResolvedValue(null);
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('El alquiler no existe');
    });

    it('Falla si el alquiler no tiene reserva asociada', async () => {
      alquilerRepo.buscarPorId.mockResolvedValue({ ...alquilerBase(), reserva_id: null });
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('no tiene una reserva asociada');
    });

    it('Falla si la reserva asociada no existe', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue(null);
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('La reserva asociada no existe');
    });

    it('Falla si el alquiler desaparece al bloquearlo', async () => {
      alquilerRepo.buscarPorId
        .mockResolvedValueOnce(alquilerBase())
        .mockResolvedValueOnce(null);
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('El alquiler no existe');
    });

    it('Falla si la reserva del alquiler cambió durante la operación', async () => {
      alquilerRepo.buscarPorId
        .mockResolvedValueOnce(alquilerBase())
        .mockResolvedValueOnce({ ...alquilerBase(), reserva_id: 99 });
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('no permite registrar cargos adicionales');
    });

    it.each(['PENDIENTE', 'CANCELADO'])('No registra cargos en alquileres %s', async (estado) => {
      alquilerRepo.buscarPorId.mockResolvedValue({ ...alquilerBase(), estado });
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('No se pueden registrar cargos en este alquiler');
    });

    it('No registra cargos en una reserva finalizada', async () => {
      alquilerRepo.buscarPorId.mockResolvedValue({ ...alquilerBase(), estado: 'FINALIZADO' });
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), estado: 'FINALIZADA' });
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('reserva finalizada');
    });

    it('Rechaza combinaciones incompatibles de estado de alquiler y reserva', async () => {
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), estado: 'DEVUELTA' });
      await expect(caso.ejecutar(1, datosValidos())).rejects.toThrow('no permite registrar cargos adicionales');
      expect(cargoRepo.crear).not.toHaveBeenCalled();
    });
  });

  describe('registro exitoso', () => {
    it('Registra un cargo en un alquiler activo con reserva entregada', async () => {
      const cargo = await caso.ejecutar('1', {
        tipo: 'LIMPIEZA',
        descripcion: '  Limpieza profunda  ',
        monto: '50.50'
      });

      expect(cargoRepo.crear).toHaveBeenCalledWith(
        { alquiler_id: 1, tipo: 'LIMPIEZA', descripcion: 'Limpieza profunda', monto: 50.5 },
        { transaction: transaccion }
      );
      expect(cargo.id).toBe(7);
    });

    it('Registra un cargo en un alquiler finalizado con reserva devuelta', async () => {
      alquilerRepo.buscarPorId.mockResolvedValue({ ...alquilerBase(), estado: 'FINALIZADO' });
      ReservaRepository.buscarPorIdTransaccional.mockResolvedValue({ ...reservaBase(), estado: 'DEVUELTA' });

      await expect(caso.ejecutar(1, datosValidos())).resolves.toMatchObject({ alquiler_id: 1, monto: 50 });
    });
  });
});
