'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // 1. Insertar Usuarios (Admin, Empleado, Cliente)
    await queryInterface.bulkInsert('usuarios', [
      { nombre: 'Super Admin', email: 'admin@rentacar.com', password: await bcrypt.hash('admin123', 10), rol: 'ADMINISTRADOR', activo: true, createdAt: now, updatedAt: now },
      { nombre: 'Empleado', email: 'empleado@rentacar.com', password: await bcrypt.hash('empleado123', 10), rol: 'EMPLEADO', activo: true, createdAt: now, updatedAt: now },
      { nombre: 'Cliente Demo', email: 'cliente@rentacar.com', password: await bcrypt.hash('cliente123', 10), rol: 'CLIENTE', activo: true, createdAt: now, updatedAt: now }
    ]);

    // 2. Insertar Categorías
    await queryInterface.bulkInsert('categorias', [
      { nombre: 'SUV', descripcion: 'Vehículos deportivos utilitarios', createdAt: now, updatedAt: now },
      { nombre: 'Sedán', descripcion: 'Vehículos de 4 puertas', createdAt: now, updatedAt: now },
      { nombre: 'Hatchback', descripcion: 'Vehículos compactos', createdAt: now, updatedAt: now }
    ]);

    // 3. Insertar Vehículos
    await queryInterface.bulkInsert('vehiculos', [
      { placa: 'SUV-01', marca: 'Toyota', modelo: 'RAV4', anio: 2022, categoria_id: 1, transmision: 'AUTOMATICA', pasajeros: 5, kilometraje_actual: 15000, estado: 'DISPONIBLE', imagen_url: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=500', createdAt: now, updatedAt: now },
      { placa: 'SED-04', marca: 'Toyota', modelo: 'Corolla', anio: 2021, categoria_id: 2, transmision: 'AUTOMATICA', pasajeros: 5, kilometraje_actual: 25000, estado: 'RESERVADA', imagen_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=500', createdAt: now, updatedAt: now },
      { placa: 'SUV-07', marca: 'Kia', modelo: 'Sportage', anio: 2023, categoria_id: 1, transmision: 'AUTOMATICA', pasajeros: 5, kilometraje_actual: 8000, estado: 'ALQUILADA', imagen_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500', createdAt: now, updatedAt: now },
      { placa: 'HB-03', marca: 'Suzuki', modelo: 'Swift', anio: 2020, categoria_id: 3, transmision: 'MANUAL', pasajeros: 4, kilometraje_actual: 35000, estado: 'MANTENIMIENTO', imagen_url: 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=500', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('vehiculos', null, {});
    await queryInterface.bulkDelete('categorias', null, {});
    await queryInterface.bulkDelete('usuarios', null, {});
  }
};