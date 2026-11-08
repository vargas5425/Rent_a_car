import { describe, it, expect } from 'vitest';
import { calcularTotal, puedeCancelar, aInputFecha } from './reservas';

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
