import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../infrastructure/repositories/VehiculoRepository.js', () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn()
  }
}));

import VehiculoRepository from '../../infrastructure/repositories/VehiculoRepository.js';
import { crearVehiculo } from './CrearVehiculo.js';
import { actualizarVehiculo } from './ActualizarVehiculo.js';
import { eliminarVehiculo } from './EliminarVehiculo.js';
import { listarVehiculos } from './ListarVehiculos.js';

const anioSiguiente = new Date().getFullYear() + 1;

const datosValidos = () => ({
  placa: 'ABC-123',
  marca: 'Toyota',
  modelo: 'Corolla',
  anio: 2022,
  categoria_id: 2
});

describe('crearVehiculo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    VehiculoRepository.create.mockImplementation(async (datos) => ({ id: 1, ...datos }));
  });

  it.each(['placa', 'marca', 'modelo', 'anio', 'categoria_id'])('Exige el campo %s', async (campo) => {
    const datos = { ...datosValidos(), [campo]: undefined };
    await expect(crearVehiculo(datos)).rejects.toThrow('Faltan campos obligatorios');
    expect(VehiculoRepository.create).not.toHaveBeenCalled();
  });

  it.each([1899, anioSiguiente + 1])('Rechaza el año %s', async (anio) => {
    await expect(crearVehiculo({ ...datosValidos(), anio })).rejects.toThrow('El año del vehículo no es válido');
  });

  it.each([1900, anioSiguiente])('Acepta el año límite %s', async (anio) => {
    await expect(crearVehiculo({ ...datosValidos(), anio })).resolves.toMatchObject({ anio });
  });

  it('Aplica los valores por defecto cuando solo se envían los datos obligatorios', async () => {
    const vehiculo = await crearVehiculo(datosValidos());

    expect(VehiculoRepository.create).toHaveBeenCalledWith({
      ...datosValidos(),
      transmision: 'MANUAL',
      pasajeros: 5,
      kilometraje_actual: 0,
      estado: 'DISPONIBLE',
      imagen_url: null,
      activo: true
    });
    expect(vehiculo.id).toBe(1);
  });

  it('Respeta los datos opcionales cuando se envían', async () => {
    await crearVehiculo({
      ...datosValidos(),
      transmision: 'AUTOMATICA',
      pasajeros: 7,
      kilometraje_actual: 15000,
      imagen_url: 'https://ejemplo.com/auto.jpg'
    });

    expect(VehiculoRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      transmision: 'AUTOMATICA',
      pasajeros: 7,
      kilometraje_actual: 15000,
      imagen_url: 'https://ejemplo.com/auto.jpg',
      estado: 'DISPONIBLE',
      activo: true
    }));
  });
});

describe('actualizarVehiculo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Actualiza el vehículo y devuelve el resultado', async () => {
    const actualizado = { id: 4, estado: 'MANTENIMIENTO' };
    VehiculoRepository.update.mockResolvedValue(actualizado);

    const resultado = await actualizarVehiculo(4, { estado: 'MANTENIMIENTO' });

    expect(VehiculoRepository.update).toHaveBeenCalledWith(4, { estado: 'MANTENIMIENTO' });
    expect(resultado).toBe(actualizado);
  });

  it('Falla si el vehículo no existe', async () => {
    VehiculoRepository.update.mockResolvedValue(null);
    await expect(actualizarVehiculo(99, {})).rejects.toThrow('Vehículo no encontrado');
  });
});

describe('eliminarVehiculo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Elimina el vehículo y devuelve true', async () => {
    VehiculoRepository.delete.mockResolvedValue(true);

    await expect(eliminarVehiculo(4)).resolves.toBe(true);
    expect(VehiculoRepository.delete).toHaveBeenCalledWith(4);
  });

  it('Falla si el vehículo no existe', async () => {
    VehiculoRepository.delete.mockResolvedValue(false);
    await expect(eliminarVehiculo(99)).rejects.toThrow('Vehículo no encontrado');
  });
});

describe('listarVehiculos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Devuelve todos los vehículos del repositorio', async () => {
    const vehiculos = [{ id: 1 }, { id: 2 }];
    VehiculoRepository.findAll.mockResolvedValue(vehiculos);

    await expect(listarVehiculos()).resolves.toBe(vehiculos);
  });
});
