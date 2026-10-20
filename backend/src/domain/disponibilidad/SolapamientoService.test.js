import { describe, it, expect } from 'vitest';
import { haySolapamiento, validarFechas } from './SolapamientoService.js';

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