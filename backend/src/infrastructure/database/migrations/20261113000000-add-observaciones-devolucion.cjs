
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // Agregar observaciones de devolución
    await queryInterface.addColumn(
      'alquileres',
      'observaciones_devolucion',
      {
        type: Sequelize.TEXT,
        allowNull: true
      }
    );

  },

  async down(queryInterface) {

    // Revertir la migración si es necesario
    await queryInterface.removeColumn(
      'alquileres',
      'observaciones_devolucion'
    );

  }
};
