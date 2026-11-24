'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('alquileres', 'observaciones_entrega', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'combustible_inicial'
    });

    await queryInterface.addColumn('alquileres', 'empleado_entrega_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'observaciones_entrega',
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('alquileres', 'empleado_entrega_id');
    await queryInterface.removeColumn('alquileres', 'observaciones_entrega');
  }
};