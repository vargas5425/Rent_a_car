import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sequelize, VehiculoModel, CategoriaModel } from '../../src/infrastructure/models/index.js';

// Estos tests usan la base de datos real, así que deben limpiar después de sí mismos.
describe('Integración: Módulo de Vehículos', () => {
  
  beforeAll(async () => {
    await sequelize.authenticate();
    // Limpiamos la tabla antes de empezar para tener un entorno limpio
    await VehiculoModel.destroy({ where: {} }); 
    
    // Creamos una categoría de prueba para asociar los vehículos
    await CategoriaModel.findOrCreate({
      where: { id: 1 },
      defaults: { nombre: 'Categoría Test', descripcion: 'Para tests' }
    });
  });

  afterAll(async () => {
    // Limpieza final
    await VehiculoModel.destroy({ where: {} });
    await sequelize.close();
  });

  it('Debe crear un vehículo correctamente', async () => {
    const nuevoAuto = await VehiculoModel.create({
      placa: 'TEST-01',
      marca: 'TestMarca',
      modelo: 'TestModelo',
      anio: 2024,
      categoria_id: 1,
      pasajeros: 5,
      kilometraje_actual: 0
    });

    expect(nuevoAuto.id).toBeDefined();
    expect(nuevoAuto.placa).toBe('TEST-01');
    expect(nuevoAuto.estado).toBe('DISPONIBLE'); // Valor por defecto
  });

  it('Debe leer el vehículo recién creado', async () => {
    const auto = await VehiculoModel.findOne({ where: { placa: 'TEST-01' } });
    expect(auto).not.toBeNull();
    expect(auto.marca).toBe('TestMarca');
  });

  it('Debe actualizar el estado del vehículo', async () => {
    const auto = await VehiculoModel.findOne({ where: { placa: 'TEST-01' } });
    await auto.update({ estado: 'MANTENIMIENTO' });
    
    const autoActualizado = await VehiculoModel.findByPk(auto.id);
    expect(autoActualizado.estado).toBe('MANTENIMIENTO');
  });

  it('Debe eliminar (borrado lógico) el vehículo', async () => {
    const auto = await VehiculoModel.findOne({ where: { placa: 'TEST-01' } });
    await auto.update({ activo: false });

    // Buscamos solo los activos
    const autoEliminado = await VehiculoModel.findOne({ where: { placa: 'TEST-01', activo: true } });
    expect(autoEliminado).toBeNull();
  });

    it('Un vehículo en MANTENIMIENTO no debe aparecer en disponibilidad', async () => {
    // 1. Creamos un vehículo en estado MANTENIMIENTO
    await VehiculoModel.create({
      placa: 'MANT-01',
      marca: 'TestMantenimiento',
      modelo: 'ModeloM',
      anio: 2024,
      categoria_id: 1,
      pasajeros: 5,
      kilometraje_actual: 0,
      estado: 'MANTENIMIENTO'
    });

    // 2. Buscamos vehículos disponibles usando el repositorio
    const VehiculoRepository = (await import('../../src/infrastructure/repositories/VehiculoRepository.js')).default;
    const disponibles = await VehiculoRepository.findDisponibles(
      new Date('2026-12-01T10:00:00'),
      new Date('2026-12-05T10:00:00')
    );

    // 3. Verificamos que el vehículo en mantenimiento NO esté en la lista
    const encontrado = disponibles.find(v => v.placa === 'MANT-01');
    expect(encontrado).toBeUndefined();
  });

    it('Debe filtrar vehículos por categoría correctamente', async () => {
    // 1. Creamos una segunda categoría
    await CategoriaModel.findOrCreate({
      where: { id: 2 },
      defaults: { nombre: 'Categoría 2', descripcion: 'Para tests' }
    });

    // 2. Creamos vehículos en diferentes categorías
    await VehiculoModel.create({
      placa: 'CAT1-01', marca: 'Marca1', modelo: 'Modelo1', anio: 2024,
      categoria_id: 1, pasajeros: 5, kilometraje_actual: 0, activo: true
    });
    await VehiculoModel.create({
      placa: 'CAT2-01', marca: 'Marca2', modelo: 'Modelo2', anio: 2024,
      categoria_id: 2, pasajeros: 5, kilometraje_actual: 0, activo: true
    });

    // 3. Buscamos solo los de la categoría 1
    const vehiculosCat1 = await VehiculoModel.findAll({
      where: { categoria_id: 1, activo: true }
    });

    // 4. Verificamos que solo estén los de la categoría 1
    expect(vehiculosCat1.length).toBeGreaterThan(0);
    vehiculosCat1.forEach(v => expect(v.categoria_id).toBe(1));
  });
});