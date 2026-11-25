import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../infrastructure/repositories/AlquileresRepository.js', () => ({
  default: { buscarPorIdConRelaciones: vi.fn() }
}));

import AlquileresRepository from '../../infrastructure/repositories/AlquileresRepository.js';
import ObtenerAlquileresActivos from './ObtenerAlquileresActivos.js';
import ObtenerAlquileresPendientes from './ObtenerAlquileresPendientes.js';
import { obtenerAlquilerPorId } from './ObtenerAlquilerPorId.js';

describe('ObtenerAlquileresActivos', () => {
  it('Consulta los alquileres en estado ACTIVO', async () => {
    const lista = [{ id: 1 }, { id: 2 }];
    const repo = { listarPorEstado: vi.fn().mockResolvedValue(lista) };

    const resultado = await new ObtenerAlquileresActivos(repo).ejecutar();

    expect(repo.listarPorEstado).toHaveBeenCalledWith('ACTIVO');
    expect(resultado).toBe(lista);
  });
});

describe('ObtenerAlquileresPendientes', () => {
  it('Consulta los alquileres en estado PENDIENTE', async () => {
    const lista = [{ id: 3 }];
    const repo = { listarPorEstado: vi.fn().mockResolvedValue(lista) };

    const resultado = await new ObtenerAlquileresPendientes(repo).ejecutar();

    expect(repo.listarPorEstado).toHaveBeenCalledWith('PENDIENTE');
    expect(resultado).toBe(lista);
  });
});

describe('obtenerAlquilerPorId', () => {
  const alquiler = { id: 8, usuario_id: 5 };

  beforeEach(() => {
    vi.clearAllMocks();
    AlquileresRepository.buscarPorIdConRelaciones.mockResolvedValue(alquiler);
  });

  it.each(['abc', 0, -4, 1.5])('Rechaza el ID inválido %s', async (id) => {
    await expect(obtenerAlquilerPorId(id)).rejects.toMatchObject({ codigo: 'VALIDACION', status: 400 });
  });

  it('Devuelve 404 si el alquiler no existe', async () => {
    AlquileresRepository.buscarPorIdConRelaciones.mockResolvedValue(null);
    await expect(obtenerAlquilerPorId(8)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADA', status: 404 });
  });

  it('Sin usuario autenticado devuelve el alquiler directamente', async () => {
    await expect(obtenerAlquilerPorId('8')).resolves.toBe(alquiler);
    expect(AlquileresRepository.buscarPorIdConRelaciones).toHaveBeenCalledWith(8);
  });

  it('El dueño puede ver su alquiler', async () => {
    await expect(obtenerAlquilerPorId(8, { id: 5, rol: 'CLIENTE' })).resolves.toBe(alquiler);
  });

  it('El personal puede ver cualquier alquiler', async () => {
    await expect(obtenerAlquilerPorId(8, { id: 1, rol: 'EMPLEADO' })).resolves.toBe(alquiler);
    await expect(obtenerAlquilerPorId(8, { id: 2, rol: 'ADMINISTRADOR' })).resolves.toBe(alquiler);
  });

  it('Otro cliente recibe 404 para no revelar el alquiler', async () => {
    await expect(obtenerAlquilerPorId(8, { id: 6, rol: 'CLIENTE' }))
      .rejects.toMatchObject({ codigo: 'NO_ENCONTRADA', status: 404 });
  });
});
