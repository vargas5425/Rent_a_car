import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../infrastructure/repositories/TarifaRepository.js', () => ({
  default: {
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    listar: vi.fn()
  }
}));

import TarifaRepository from '../../infrastructure/repositories/TarifaRepository.js';
import { crearTarifa } from './CrearTarifa.js';
import { actualizarTarifa, eliminarTarifa } from './ActualizarTarifa.js';
import { listarTarifas } from './ListarTarifas.js';

describe('crearTarifa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TarifaRepository.crear.mockImplementation(async (datos) => ({ id: 1, ...datos }));
  });

  it.each([
    [{ precio: 40, vehiculo_id: 1 }],
    [{ modalidad: 'HORA', vehiculo_id: 1 }],
    [{ modalidad: 'HORA', precio: 0, vehiculo_id: 1 }]
  ])('Exige modalidad y precio (%o)', async (datos) => {
    await expect(crearTarifa(datos)).rejects.toThrow('La modalidad y el precio son obligatorios');
    expect(TarifaRepository.crear).not.toHaveBeenCalled();
  });

  it('Exige asociar la tarifa a un vehículo o a una categoría', async () => {
    await expect(crearTarifa({ modalidad: 'HORA', precio: 40 }))
      .rejects.toThrow('La tarifa debe estar asociada a un vehículo o a una categoría');
    expect(TarifaRepository.crear).not.toHaveBeenCalled();
  });

  it('Crea una tarifa para un vehículo y deja la categoría en null', async () => {
    const tarifa = await crearTarifa({ modalidad: 'HORA', precio: 40, vehiculo_id: 3 });

    expect(TarifaRepository.crear).toHaveBeenCalledWith({
      modalidad: 'HORA',
      precio: 40,
      vehiculo_id: 3,
      categoria_id: null
    });
    expect(tarifa.id).toBe(1);
  });

  it('Crea una tarifa para una categoría y deja el vehículo en null', async () => {
    await crearTarifa({ modalidad: 'DIA', precio: 300, categoria_id: 2 });

    expect(TarifaRepository.crear).toHaveBeenCalledWith({
      modalidad: 'DIA',
      precio: 300,
      vehiculo_id: null,
      categoria_id: 2
    });
  });
});

describe('actualizarTarifa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Actualiza la tarifa y devuelve el resultado del repositorio', async () => {
    const actualizada = { id: 5, precio: 55 };
    TarifaRepository.actualizar.mockResolvedValue(actualizada);

    const resultado = await actualizarTarifa(5, { precio: 55 });

    expect(TarifaRepository.actualizar).toHaveBeenCalledWith(5, { precio: 55 });
    expect(resultado).toBe(actualizada);
  });
});

describe('eliminarTarifa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Elimina la tarifa y devuelve true', async () => {
    TarifaRepository.eliminar.mockResolvedValue(undefined);

    await expect(eliminarTarifa(5)).resolves.toBe(true);
    expect(TarifaRepository.eliminar).toHaveBeenCalledWith(5);
  });
});

describe('listarTarifas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Devuelve todas las tarifas del repositorio', async () => {
    const tarifas = [{ id: 1 }, { id: 2 }];
    TarifaRepository.listar.mockResolvedValue(tarifas);

    await expect(listarTarifas()).resolves.toBe(tarifas);
  });
});
