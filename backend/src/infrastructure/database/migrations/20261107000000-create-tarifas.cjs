'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tarifas', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      modalidad: { type: Sequelize.ENUM('HORA', 'DIA', 'SEMANA', 'MES'), allowNull: false },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      vehiculo_id: {
        type: Sequelize.INTEGER,
        references: { model: 'vehiculos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: true
      },
      categoria_id: {
        type: Sequelize.INTEGER,
        references: { model: 'categorias', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: true
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tarifas');
  }
};