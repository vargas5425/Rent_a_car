import { describe, it, expect } from 'vitest';
import { haySolapamiento, validarFechas } from './SolapamientoService.js';

// Atajo: intervalos del mismo día (20 de noviembre) a partir de las horas de inicio y fin.
const hora = (h) => `2026-11-20T${String(h).padStart(2, '0')}:00:00`;
const choca = (inicioA, finA, inicioB, finB) => haySolapamiento(hora(inicioA), hora(finA), hora(inicioB), hora(finB));

describe('Reglas de Disponibilidad y Solapamiento', () => {
  it('Debe detectar solapamiento parcial (10:00-14:00 vs 12:00-16:00)', () => {
    expect(haySolapamiento('2026-11-20T10:00:00', '2026-11-20T14:00:00', '2026-11-20T12:00:00', '2026-11-20T16:00:00')).toBe(true);
  });

  it('NO debe detectar solapamiento si son contiguos (10:00-14:00 vs 14:00-18:00)', () => {
    expect(haySolapamiento('2026-11-20T10:00:00', '2026-11-20T14:00:00', '2026-11-20T14:00:00', '2026-11-20T18:00:00')).toBe(false);
  });

  it('Debe rechazar fechas invertidas', () => {
    expect(() => validarFechas('2026-11-20T14:00:00', '2026-11-20T10:00:00')).toThrow();
  });
});

describe('Detectar solapamiento', () => {
  it('Detecta el choque parcial sin importar cuál de los dos intervalos va primero', () => {
    expect(choca(10, 14, 12, 16)).toBe(true);
    expect(choca(12, 16, 10, 14)).toBe(true);
  });

  it('Detecta cuando un intervalo está contenido dentro de otro', () => {
    expect(choca(10, 18, 12, 14)).toBe(true);
    expect(choca(12, 14, 10, 18)).toBe(true);
  });

  it('Detecta dos intervalos idénticos', () => {
    expect(choca(10, 14, 10, 14)).toBe(true);
  });

  it('Detecta cuando comparten el mismo inicio o el mismo fin', () => {
    expect(choca(10, 12, 10, 14)).toBe(true);
    expect(choca(10, 14, 12, 14)).toBe(true);
  });

  it('Detecta un choque de un solo minuto', () => {
    expect(
      haySolapamiento('2026-11-20T10:00:00', '2026-11-20T14:01:00', '2026-11-20T14:00:00', '2026-11-20T18:00:00')
    ).toBe(true);
  });

  it('Acepta fechas como Date o como texto', () => {
    expect(haySolapamiento(new Date(hora(10)), new Date(hora(14)), hora(12), hora(16))).toBe(true);
  });
});

describe('Permitir intervalos que no se solapan', () => {
  it('Permite intervalos contiguos, en cualquiera de los dos órdenes (el fin no cuenta: [inicio, fin))', () => {
    expect(choca(10, 14, 14, 18)).toBe(false);
    expect(choca(14, 18, 10, 14)).toBe(false);
  });

  it('Permite intervalos separados el mismo día', () => {
    expect(choca(8, 10, 14, 16)).toBe(false);
    expect(choca(14, 16, 8, 10)).toBe(false);
  });

  it('Permite intervalos en días distintos', () => {
    expect(
      haySolapamiento('2026-11-20T10:00:00', '2026-11-20T14:00:00', '2026-11-21T10:00:00', '2026-11-21T14:00:00')
    ).toBe(false);
  });

  it('Permite intervalos contiguos de un solo minuto', () => {
    expect(
      haySolapamiento('2026-11-20T10:00:00', '2026-11-20T10:01:00', '2026-11-20T10:01:00', '2026-11-20T10:02:00')
    ).toBe(false);
  });
});