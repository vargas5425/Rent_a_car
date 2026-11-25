import { describe, it, expect, vi, beforeEach } from 'vitest';
import { construirGestionReservas } from './GestionReserva.js';
import { ReservaError } from '../../domain/reservas/ReservaError.js';

const HORA = 60 * 60 * 1000;
const enHoras = (n) => new Date(Date.now() + n * HORA).toISOString();

const cliente = { id: 5, rol: 'CLIENTE' };
const otroCliente = { id: 6, rol: 'CLIENTE' };
const empleado = { id: 1, rol: 'EMPLEADO' };
const admin = { id: 2, rol: 'ADMINISTRADOR' };

const reservaDe = (estado, extra = {}) => ({ id: 20, usuario_id: 5, vehiculo_id: 3, estado, ...extra });

describe('GestionReserva', () => {
  let reservaRepo;
  let vehiculoRepo;
  let servicio;

  beforeEach(() => {
    reservaRepo = {
      findByUsuario: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      actualizarEstado: vi.fn(),
      actualizarEstadoSiLibre: vi.fn()
    };
    vehiculoRepo = { findById: vi.fn(), findDisponibles: vi.fn() };
    vehiculoRepo.findById.mockResolvedValue({ id: 3, estado: 'DISPONIBLE', activo: true });
    servicio = construirGestionReservas({ reservaRepo, vehiculoRepo });
  });

  describe('listados', () => {
    it('Lista las reservas de un usuario convirtiendo el id a número', async () => {
      reservaRepo.findByUsuario.mockResolvedValue([reservaDe('RESERVADA')]);
      const resultado = await servicio.listarMisReservas('5');
      expect(reservaRepo.findByUsuario).toHaveBeenCalledWith(5);
      expect(resultado).toHaveLength(1);
    });

    it('Lista todas las reservas', async () => {
      reservaRepo.findAll.mockResolvedValue([reservaDe('RESERVADA'), reservaDe('CANCELADA')]);
      const resultado = await servicio.listarTodas();
      expect(resultado).toHaveLength(2);
    });
  });

  describe('obtenerReserva', () => {
    it('El dueño puede ver su reserva', async () => {
      const reserva = reservaDe('RESERVADA');
      reservaRepo.findById.mockResolvedValue(reserva);
      await expect(servicio.obtenerReserva('20', cliente)).resolves.toBe(reserva);
    });

    it('El personal puede ver la reserva de cualquier cliente', async () => {
      const reserva = reservaDe('RESERVADA');
      reservaRepo.findById.mockResolvedValue(reserva);
      await expect(servicio.obtenerReserva(20, empleado)).resolves.toBe(reserva);
      await expect(servicio.obtenerReserva(20, admin)).resolves.toBe(reserva);
    });

    it('Otro cliente recibe 404 para no revelar que la reserva existe', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('RESERVADA'));
      await expect(servicio.obtenerReserva(20, otroCliente))
        .rejects.toMatchObject({ codigo: 'NO_ENCONTRADA', status: 404 });
    });

    it('Devuelve 404 si la reserva no existe', async () => {
      reservaRepo.findById.mockResolvedValue(null);
      await expect(servicio.obtenerReserva(99, admin)).rejects.toBeInstanceOf(ReservaError);
    });
  });

  describe('confirmarReserva', () => {
    it('Confirma una reserva en estado RESERVADA', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('RESERVADA'));
      reservaRepo.actualizarEstadoSiLibre.mockResolvedValue(reservaDe('CONFIRMADA'));

      const resultado = await servicio.confirmarReserva(20);

      expect(reservaRepo.actualizarEstadoSiLibre).toHaveBeenCalledWith(20, 'CONFIRMADA');
      expect(resultado.estado).toBe('CONFIRMADA');
    });

    it('Devuelve 404 si la reserva no existe', async () => {
      reservaRepo.findById.mockResolvedValue(null);
      await expect(servicio.confirmarReserva(99)).rejects.toMatchObject({ status: 404 });
    });

    it('No permite confirmar una reserva cancelada', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('CANCELADA'));
      await expect(servicio.confirmarReserva(20))
        .rejects.toMatchObject({ codigo: 'TRANSICION_INVALIDA', status: 409 });
      expect(reservaRepo.actualizarEstadoSiLibre).not.toHaveBeenCalled();
    });

    it('No permite confirmar si el vehículo entró a mantenimiento', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('RESERVADA'));
      vehiculoRepo.findById.mockResolvedValue({ id: 3, estado: 'MANTENIMIENTO', activo: true });
      await expect(servicio.confirmarReserva(20)).rejects.toMatchObject({ codigo: 'CONFLICTO' });
    });

    it('Devuelve 409 si el vehículo ya no está libre en ese horario', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('RESERVADA'));
      reservaRepo.actualizarEstadoSiLibre.mockResolvedValue(null);
      await expect(servicio.confirmarReserva(20))
        .rejects.toMatchObject({ codigo: 'CONFLICTO', status: 409 });
    });
  });

  describe('cancelarReserva', () => {
    it('El dueño cancela una reserva RESERVADA', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('RESERVADA'));
      reservaRepo.actualizarEstado.mockResolvedValue(reservaDe('CANCELADA'));

      const resultado = await servicio.cancelarReserva(20, cliente);

      expect(reservaRepo.actualizarEstado).toHaveBeenCalledWith(20, 'CANCELADA');
      expect(resultado.estado).toBe('CANCELADA');
    });

    it('Se puede cancelar una reserva CONFIRMADA', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('CONFIRMADA'));
      reservaRepo.actualizarEstado.mockResolvedValue(reservaDe('CANCELADA'));
      await expect(servicio.cancelarReserva(20, empleado)).resolves.toMatchObject({ estado: 'CANCELADA' });
    });

    it('No se puede cancelar una reserva ya entregada', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('ENTREGADA'));
      await expect(servicio.cancelarReserva(20, cliente))
        .rejects.toMatchObject({ codigo: 'TRANSICION_INVALIDA' });
      expect(reservaRepo.actualizarEstado).not.toHaveBeenCalled();
    });

    it('Otro cliente no puede cancelar una reserva ajena', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('RESERVADA'));
      await expect(servicio.cancelarReserva(20, otroCliente)).rejects.toMatchObject({ status: 404 });
      expect(reservaRepo.actualizarEstado).not.toHaveBeenCalled();
    });
  });

  describe('finalizarReserva', () => {
    it('Finaliza una reserva que ya fue devuelta', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('DEVUELTA'));
      reservaRepo.actualizarEstado.mockResolvedValue(reservaDe('FINALIZADA'));

      const resultado = await servicio.finalizarReserva(20);

      expect(reservaRepo.actualizarEstado).toHaveBeenCalledWith(20, 'FINALIZADA');
      expect(resultado.estado).toBe('FINALIZADA');
    });

    it('Devuelve 404 si la reserva no existe', async () => {
      reservaRepo.findById.mockResolvedValue(null);
      await expect(servicio.finalizarReserva(99)).rejects.toMatchObject({ status: 404 });
    });

    it('No se puede finalizar una reserva que nunca se devolvió', async () => {
      reservaRepo.findById.mockResolvedValue(reservaDe('RESERVADA'));
      await expect(servicio.finalizarReserva(20))
        .rejects.toMatchObject({ codigo: 'TRANSICION_INVALIDA' });
    });
  });

  describe('buscarVehiculosDisponibles', () => {
    it('Busca vehículos libres en un rango válido', async () => {
      const disponibles = [{ id: 1 }, { id: 2 }];
      vehiculoRepo.findDisponibles.mockResolvedValue(disponibles);
      const inicio = enHoras(2);
      const fin = enHoras(10);

      const resultado = await servicio.buscarVehiculosDisponibles({ fechaInicio: inicio, fechaFin: fin });

      expect(resultado).toBe(disponibles);
      expect(vehiculoRepo.findDisponibles).toHaveBeenCalledWith(new Date(inicio), new Date(fin));
    });

    it('Rechaza un rango de fechas inválido', async () => {
      await expect(servicio.buscarVehiculosDisponibles({ fechaInicio: enHoras(10), fechaFin: enHoras(2) }))
        .rejects.toMatchObject({ codigo: 'VALIDACION' });
      expect(vehiculoRepo.findDisponibles).not.toHaveBeenCalled();
    });
  });
});
