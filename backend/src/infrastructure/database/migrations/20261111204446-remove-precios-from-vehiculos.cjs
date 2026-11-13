'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('vehiculos', 'precio_hora');
    await queryInterface.removeColumn('vehiculos', 'precio_dia');
    // Si también agregaste precio_semana y precio_mes antes, descomenta las siguientes líneas:
    // await queryInterface.removeColumn('vehiculos', 'precio_semana');
    // await queryInterface.removeColumn('vehiculos', 'precio_mes');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('vehiculos', 'precio_hora', { type: Sequelize.DECIMAL(10,2), defaultValue: 40 });
    await queryInterface.addColumn('vehiculos', 'precio_dia', { type: Sequelize.DECIMAL(10,2), defaultValue: 300 });
  }
};