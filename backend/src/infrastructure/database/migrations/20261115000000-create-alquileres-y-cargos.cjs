'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear tabla de Alquileres
    await queryInterface.createTable('alquileres', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      reserva_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        references: { model: 'reservas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' }
      },
      vehiculo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vehiculos', key: 'id' }
      },
      fecha_inicio: { type: Sequelize.DATE, allowNull: false },
      fecha_fin: { type: Sequelize.DATE, allowNull: false },
      fecha_entrega: { type: Sequelize.DATE, allowNull: true },
      fecha_devolucion: { type: Sequelize.DATE, allowNull: true },
      kilometraje_inicial: { type: Sequelize.INTEGER, allowNull: true },
      kilometraje_final: { type: Sequelize.INTEGER, allowNull: true },
      combustible_inicial: { type: Sequelize.INTEGER, allowNull: true },
      combustible_final: { type: Sequelize.INTEGER, allowNull: true },
      observaciones_devolucion: { type: Sequelize.TEXT, allowNull: true },
      modalidad: { type: Sequelize.ENUM('HORA', 'DIA', 'SEMANA', 'MES'), allowNull: true },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      tarifa_diaria: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      monto_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'ACTIVO', 'FINALIZADO', 'CANCELADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    // 2. Crear tabla de Cargos Adicionales
    await queryInterface.createTable('cargos_adicionales', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      alquiler_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'alquileres', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('DANIO', 'LIMPIEZA', 'KILOMETRAJE', 'OTRO', 'RETRASO', 'COMBUSTIBLE'),
        allowNull: false
      },
      descripcion: { type: Sequelize.STRING, allowNull: false },
      monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      fecha_cargo: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cargos_adicionales');
    await queryInterface.dropTable('alquileres');
  }
};