import { describe, it, expect } from 'vitest';
import { calcularPrecio, calcularCargoRetraso, calcularCargoCombustible } from './TarifaService.js';

describe('Cálculo de Tarifas', () => {
  it('Debe cobrar 4 horas exactas', () => {
    expect(calcularPrecio(4, 'HORA', 40)).toBe(160);
  });

  it('Debe redondear 4.5 horas a 5 horas', () => {
    expect(calcularPrecio(4.5, 'HORA', 40)).toBe(200);
  });
});

describe('Cargos Adicionales', () => {
  it('Debe cobrar Bs 100 si el combustible baja de LLENO a 1/2', () => {
    expect(calcularCargoCombustible('LLENO', '1/2')).toBe(100);
  });
});