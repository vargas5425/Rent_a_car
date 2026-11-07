import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcularPrecioReserva } from './TarifaService.js';

// 1. Simulamos el repositorio AQUÍ, antes de importar el Servicio
vi.mock('../../infrastructure/repositories/TarifaRepository.js', () => {
  return {
    default: {
      buscarPorVehiculo: vi.fn(),
      buscarPorCategoria: vi.fn(),
    }
  };
});

// 2. Ahora importamos el repositorio (será la versión falsa)
import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';

describe('Regla Crítica: Prioridad Vehículo > Categoría', () => {
  
  // Limpiamos los mocks antes de cada test para que no se mezclen
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe usar la tarifa del VEHÍCULO si existe', async () => {
    // Simulamos que el vehículo SÍ tiene tarifa
    TarifaRepository.buscarPorVehiculo.mockResolvedValue([{ modalidad: 'DIA', precio: 100 }]);
    
    const vehiculo = { id: 1, categoria_id: 2 };
    const resultado = await calcularPrecioReserva(vehiculo, 24, 'DIA');
    
    expect(resultado).toBe(100); // Cobró el del vehículo
    expect(TarifaRepository.buscarPorCategoria).not.toHaveBeenCalled(); 
  });

  it('Debe usar la tarifa de la CATEGORÍA si el vehículo no tiene', async () => {
    // Simulamos que el vehículo NO tiene, pero la categoría SÍ
    TarifaRepository.buscarPorVehiculo.mockResolvedValue([]);
    TarifaRepository.buscarPorCategoria.mockResolvedValue([{ modalidad: 'DIA', precio: 80 }]);
    
    const vehiculo = { id: 1, categoria_id: 2 };
    const resultado = await calcularPrecioReserva(vehiculo, 24, 'DIA');
    
    expect(resultado).toBe(80); // Cobró el de la categoría
  });
});