'use strict';

module.exports = {
  async up(queryInterface) {
    const columnas = await queryInterface.describeTable('vehiculos');
    for (const nombre of ['precio_hora', 'precio_dia', 'precio_semana', 'precio_mes']) {
      if (columnas[nombre]) {
        await queryInterface.removeColumn('vehiculos', nombre);
      }
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('vehiculos', 'precio_hora', { type: Sequelize.DECIMAL(10, 2), defaultValue: 40 });
    await queryInterface.addColumn('vehiculos', 'precio_dia', { type: Sequelize.DECIMAL(10, 2), defaultValue: 300 });
  }
};