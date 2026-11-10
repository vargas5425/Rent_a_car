import { describe, it, expect } from 'vitest';
import { calcularTotal, puedeCancelar, aInputFecha, validarBusqueda } from './reservas';

describe('validarBusqueda (formulario de búsqueda)', () => {
  // "Ahora" fijo para que los tests no dependan de la hora real: 20-nov-2026 12:00 (hora local).
  const ahora = new Date(2026, 10, 20, 12, 0);

  it('Acepta fechas futuras con el fin posterior al inicio', () => {
    expect(validarBusqueda({ inicio: '2026-11-21T10:00', fin: '2026-11-21T14:00', ahora })).toBe('');
  });

  it('Pide las dos fechas si falta alguna', () => {
    const mensaje = 'Elige la fecha de inicio y la de fin.';
    expect(validarBusqueda({ inicio: '', fin: '', ahora })).toBe(mensaje);
    expect(validarBusqueda({ inicio: '2026-11-21T10:00', fin: '', ahora })).toBe(mensaje);
    expect(validarBusqueda({ inicio: '', fin: '2026-11-21T14:00', ahora })).toBe(mensaje);
  });

  it('Rechaza una fecha con formato inválido', () => {
    expect(validarBusqueda({ inicio: 'mañana', fin: '2026-11-21T14:00', ahora })).toBe(
      'Una de las fechas no tiene un formato válido.'
    );
  });

  it('Rechaza una recogida en el pasado', () => {
    expect(validarBusqueda({ inicio: '2026-11-19T10:00', fin: '2026-11-21T14:00', ahora })).toBe(
      'La fecha de recogida no puede estar en el pasado.'
    );
  });

  it('Acepta una recogida justo en este instante (no es pasado)', () => {
    expect(validarBusqueda({ inicio: '2026-11-20T12:00', fin: '2026-11-20T16:00', ahora })).toBe('');
  });

  it('Rechaza una devolución anterior a la recogida', () => {
    expect(validarBusqueda({ inicio: '2026-11-21T14:00', fin: '2026-11-21T10:00', ahora })).toBe(
      'La fecha de devolución debe ser posterior a la de recogida.'
    );
  });

  it('Rechaza una devolución igual a la recogida', () => {
    expect(validarBusqueda({ inicio: '2026-11-21T10:00', fin: '2026-11-21T10:00', ahora })).toBe(
      'La fecha de devolución debe ser posterior a la de recogida.'
    );
  });
});

describe('calcularTotal (vista previa)', () => {
  it('4 horas a Bs 40 por hora = Bs 160', () => {
    const r = calcularTotal({
      fechaInicio: '2026-11-20T10:00',
      fechaFin: '2026-11-20T14:00',
      modalidad: 'HORA',
      precioUnitario: 40
    });
    expect(r.total).toBe(160);
  });

  it('4 horas y 15 minutos se cobran como 5 horas', () => {
    const r = calcularTotal({
      fechaInicio: '2026-11-20T10:00',
      fechaFin: '2026-11-20T14:15',
      modalidad: 'HORA',
      precioUnitario: 40
    });
    expect(r.unidades).toBe(5);
    expect(r.total).toBe(200);
  });

  it('1 día y 2 horas por día se cobran como 2 días', () => {
    const r = calcularTotal({
      fechaInicio: '2026-11-20T10:00',
      fechaFin: '2026-11-21T12:00',
      modalidad: 'DIA',
      precioUnitario: 300
    });
    expect(r.total).toBe(600);
  });

  it('Devuelve null si las fechas no son válidas o el fin no es posterior al inicio', () => {
    expect(calcularTotal({ fechaInicio: '', fechaFin: '', modalidad: 'HORA', precioUnitario: 40 })).toBeNull();
    expect(
      calcularTotal({
        fechaInicio: '2026-11-20T14:00',
        fechaFin: '2026-11-20T10:00',
        modalidad: 'HORA',
        precioUnitario: 40
      })
    ).toBeNull();
  });
});

describe('puedeCancelar', () => {
  it('Solo en RESERVADA y CONFIRMADA', () => {
    expect(puedeCancelar('RESERVADA')).toBe(true);
    expect(puedeCancelar('CONFIRMADA')).toBe(true);
    expect(puedeCancelar('ENTREGADA')).toBe(false);
    expect(puedeCancelar('CANCELADA')).toBe(false);
  });
});

describe('aInputFecha', () => {
  it('Formatea en el formato de datetime-local', () => {
    expect(aInputFecha(new Date(2026, 10, 20, 9, 5))).toBe('2026-11-20T09:05');
  });
});