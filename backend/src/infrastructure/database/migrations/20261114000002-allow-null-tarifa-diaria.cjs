
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('alquileres', 'tarifa_diaria', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('alquileres', 'tarifa_diaria', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
  }
};
