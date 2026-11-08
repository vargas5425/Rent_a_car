import { describe, it, expect } from 'vitest';
import {
  ESTADOS,
  ESTADOS_BLOQUEANTES,
  puedeTransicionar,
  transicionar,
  cancelar,
  bloqueaDisponibilidad,
  calcularTotalReserva,
  validarNuevaReserva
} from './Reserva.js';
import { ReservaError } from './ReservaError.js';

const HORA = 60 * 60 * 1000;
const enHoras = (horas) => new Date(Date.now() + horas * HORA);

describe('Máquina de estados de la reserva', () => {
  it('Recorre el camino feliz RESERVADA -> CONFIRMADA -> ENTREGADA -> DEVUELTA -> FINALIZADA', () => {
    let estado = ESTADOS.RESERVADA;
    for (const siguiente of [ESTADOS.CONFIRMADA, ESTADOS.ENTREGADA, ESTADOS.DEVUELTA, ESTADOS.FINALIZADA]) {
      estado = transicionar(estado, siguiente);
      expect(estado).toBe(siguiente);
    }
  });

  it('No se puede entregar una reserva CANCELADA', () => {
    expect(() => transicionar(ESTADOS.CANCELADA, ESTADOS.ENTREGADA)).toThrow(ReservaError);
  });

  it('No se puede devolver algo que nunca se entregó', () => {
    expect(() => transicionar(ESTADOS.RESERVADA, ESTADOS.DEVUELTA)).toThrow(ReservaError);
    expect(() => transicionar(ESTADOS.CONFIRMADA, ESTADOS.DEVUELTA)).toThrow(ReservaError);
  });

  it('No se puede saltar la confirmación (RESERVADA -> ENTREGADA)', () => {
    expect(puedeTransicionar(ESTADOS.RESERVADA, ESTADOS.ENTREGADA)).toBe(false);
  });

  it('Los estados finales no tienen salida', () => {
    for (const final of [ESTADOS.FINALIZADA, ESTADOS.CANCELADA]) {
      for (const destino of Object.values(ESTADOS)) {
        expect(puedeTransicionar(final, destino)).toBe(false);
      }
    }
  });

  it('Rechaza estados que no existen', () => {
    expect(() => transicionar('INVENTADA', ESTADOS.CONFIRMADA)).toThrow(ReservaError);
    expect(() => transicionar(ESTADOS.RESERVADA, 'INVENTADA')).toThrow(ReservaError);
  });

  it('El error de transición inválida lleva código y status 409', () => {
    let error;
    try {
      transicionar(ESTADOS.CANCELADA, ESTADOS.ENTREGADA);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ReservaError);
    expect(error.codigo).toBe('TRANSICION_INVALIDA');
    expect(error.status).toBe(409);
  });
});

describe('Cancelación', () => {
  it('Se puede cancelar desde RESERVADA y desde CONFIRMADA', () => {
    expect(cancelar(ESTADOS.RESERVADA)).toBe(ESTADOS.CANCELADA);
    expect(cancelar(ESTADOS.CONFIRMADA)).toBe(ESTADOS.CANCELADA);
  });

  it('No se puede cancelar una vez entregada, devuelta, finalizada o ya cancelada', () => {
    for (const estado of [ESTADOS.ENTREGADA, ESTADOS.DEVUELTA, ESTADOS.FINALIZADA, ESTADOS.CANCELADA]) {
      expect(() => cancelar(estado)).toThrow(ReservaError);
    }
  });
});

describe('Estados que bloquean la disponibilidad', () => {
  it('RESERVADA, CONFIRMADA y ENTREGADA bloquean las fechas', () => {
    expect(ESTADOS_BLOQUEANTES).toEqual([ESTADOS.RESERVADA, ESTADOS.CONFIRMADA, ESTADOS.ENTREGADA]);
  });

  it('CANCELADA, DEVUELTA y FINALIZADA liberan las fechas', () => {
    expect(bloqueaDisponibilidad(ESTADOS.CANCELADA)).toBe(false);
    expect(bloqueaDisponibilidad(ESTADOS.DEVUELTA)).toBe(false);
    expect(bloqueaDisponibilidad(ESTADOS.FINALIZADA)).toBe(false);
  });
});

describe('Cálculo del total de la reserva', () => {
  it('4 horas a Bs 40 por hora = Bs 160', () => {
    const { total, horas } = calcularTotalReserva({
      fechaInicio: '2026-11-20T10:00:00',
      fechaFin: '2026-11-20T14:00:00',
      modalidad: 'HORA',
      precioUnitario: 40
    });
    expect(horas).toBe(4);
    expect(total).toBe(160);
  });

  it('4 horas y 15 minutos se cobran como 5 horas', () => {
    const { total } = calcularTotalReserva({
      fechaInicio: '2026-11-20T10:00:00',
      fechaFin: '2026-11-20T14:15:00',
      modalidad: 'HORA',
      precioUnitario: 40
    });
    expect(total).toBe(200);
  });

  it('1 día y 2 horas por día se cobran como 2 días', () => {
    const { total } = calcularTotalReserva({
      fechaInicio: '2026-11-20T10:00:00',
      fechaFin: '2026-11-21T12:00:00',
      modalidad: 'DIA',
      precioUnitario: 300
    });
    expect(total).toBe(600);
  });

  it('24 horas exactas por día se cobran como 1 día', () => {
    const { total } = calcularTotalReserva({
      fechaInicio: '2026-11-20T10:00:00',
      fechaFin: '2026-11-21T10:00:00',
      modalidad: 'DIA',
      precioUnitario: 300
    });
    expect(total).toBe(300);
  });

  it('Rechaza una duración de cero o negativa', () => {
    expect(() =>
      calcularTotalReserva({
        fechaInicio: '2026-11-20T10:00:00',
        fechaFin: '2026-11-20T10:00:00',
        modalidad: 'HORA',
        precioUnitario: 40
      })
    ).toThrow();
  });
});

describe('Validación de una reserva nueva', () => {
  it('Acepta un intervalo futuro con modalidad válida', () => {
    expect(() =>
      validarNuevaReserva({ fechaInicio: enHoras(24), fechaFin: enHoras(28), modalidad: 'HORA' })
    ).not.toThrow();
  });

  it('Rechaza fechas en el pasado', () => {
    expect(() =>
      validarNuevaReserva({ fechaInicio: enHoras(-5), fechaFin: enHoras(2), modalidad: 'HORA' })
    ).toThrow(ReservaError);
  });

  it('Rechaza fecha de fin anterior a la de inicio', () => {
    expect(() =>
      validarNuevaReserva({ fechaInicio: enHoras(28), fechaFin: enHoras(24), modalidad: 'HORA' })
    ).toThrow(ReservaError);
  });

  it('Rechaza fechas con formato inválido', () => {
    expect(() =>
      validarNuevaReserva({ fechaInicio: 'mañana', fechaFin: 'pasado', modalidad: 'HORA' })
    ).toThrow(ReservaError);
  });

  it('Rechaza modalidades no soportadas', () => {
    expect(() =>
      validarNuevaReserva({ fechaInicio: enHoras(24), fechaFin: enHoras(28), modalidad: 'SEMANA' })
    ).toThrow(ReservaError);
  });
});
