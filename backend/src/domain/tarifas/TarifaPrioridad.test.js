import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcularPrecioReserva } from './TarifaService.js';

// Simulamos el repositorio
const mockTarifaRepo = {
  buscarPorVehiculo: vi.fn(),
  buscarPorCategoria: vi.fn(),
};

describe('Regla Crítica: Prioridad Vehículo > Categoría', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe usar la tarifa del VEHÍCULO si existe', async () => {
    mockTarifaRepo.buscarPorVehiculo.mockResolvedValue([{ modalidad: 'DIA', precio: 100 }]);
    
    const vehiculo = { id: 1, categoria_id: 2 };
    // 👇 Le pasamos el mock como parámetro
    const resultado = await calcularPrecioReserva(vehiculo, 24, 'DIA', mockTarifaRepo);
    
    expect(resultado).toBe(100);
    expect(mockTarifaRepo.buscarPorCategoria).not.toHaveBeenCalled(); 
  });

  it('Debe usar la tarifa de la CATEGORÍA si el vehículo no tiene', async () => {
    mockTarifaRepo.buscarPorVehiculo.mockResolvedValue([]);
    mockTarifaRepo.buscarPorCategoria.mockResolvedValue([{ modalidad: 'DIA', precio: 80 }]);
    
    const vehiculo = { id: 1, categoria_id: 2 };
    const resultado = await calcularPrecioReserva(vehiculo, 24, 'DIA', mockTarifaRepo);
    
    expect(resultado).toBe(80);
  });
});