import { describe, it, expect } from 'vitest';
import { calcularPrecio, calcularCargoRetraso, calcularCargoCombustible } from './TarifaService.js';

describe('Cálculo de Tarifas Base', () => {
  it('Debe cobrar 4 horas exactas', () => {
    expect(calcularPrecio(4, 'HORA', 40)).toBe(160);
  });

  it('Debe redondear 4.5 horas a 5 horas', () => {
    expect(calcularPrecio(4.5, 'HORA', 40)).toBe(200);
  });
});

describe('Cargos Adicionales - Combustible', () => {
  it('Debe cobrar Bs 100 si el combustible baja de LLENO (100) a 1/2 (50)', () => {
    // 100 - 50 = 50 faltante -> 2 bloques de 25 -> 2 * 50 = 100
    const resultado = calcularCargoCombustible({ combustible_inicial: 100, combustible_final: 50 });
    expect(resultado.monto).toBe(100);
  });

  it('No debe cobrar si el combustible se mantiene o sube', () => {
    expect(calcularCargoCombustible({ combustible_inicial: 50, combustible_final: 50 }).monto).toBe(0);
    expect(calcularCargoCombustible({ combustible_inicial: 50, combustible_final: 75 }).monto).toBe(0);
  });

  it('Debe cobrar Bs 50 si falta solo un 10% (redondeo hacia arriba)', () => {
    // 100 - 90 = 10 faltante -> 1 bloque (Math.ceil(10/25)) -> 50
    expect(calcularCargoCombustible({ combustible_inicial: 100, combustible_final: 90 }).monto).toBe(50);
  });
});

describe('Cargos Adicionales - Retraso', () => {
  it('No debe cobrar si se devuelve a tiempo o antes', () => {
    const res = calcularCargoRetraso({
      fecha_fin: '2026-11-20T10:00:00',
      fecha_devolucion: '2026-11-20T09:00:00',
      modalidad: 'HORA',
      precio_unitario: 40
    });
    expect(res.monto).toBe(0);
    expect(res.horas_retraso).toBe(0);
  });

  it('Debe cobrar 2 horas de retraso con tarifa por HORA', () => {
    // Se pasó 1 hora y 1 minuto -> Math.ceil redondea a 2 horas -> 2 * 40 = 80
    const res = calcularCargoRetraso({
      fecha_fin: '2026-11-20T10:00:00',
      fecha_devolucion: '2026-11-20T11:01:00',
      modalidad: 'HORA',
      precio_unitario: 40
    });
    expect(res.horas_retraso).toBe(2);
    expect(res.monto).toBe(80);
  });

  it('Debe cobrar proporcional si la tarifa es por DIA', () => {
    // 12 horas de retraso en una tarifa diaria de 240 -> 12/24 = 0.5 dias -> 120 Bs
    const res = calcularCargoRetraso({
      fecha_fin: '2026-11-20T10:00:00',
      fecha_devolucion: '2026-11-20T22:00:00',
      modalidad: 'DIA',
      precio_unitario: 240
    });
    expect(res.horas_retraso).toBe(12);
    expect(res.monto).toBe(120);
  });
});