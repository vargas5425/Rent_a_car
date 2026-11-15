
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('alquileres', 'modalidad', {
      type: Sequelize.ENUM('HORA', 'DIA', 'SEMANA', 'MES'),
      allowNull: true
    });

    await queryInterface.addColumn('alquileres', 'precio_unitario', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'alquileres',
      'precio_unitario'
    );

    await queryInterface.removeColumn(
      'alquileres',
      'modalidad'
    );
  }
};
