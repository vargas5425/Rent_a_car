
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // Obtener las columnas actuales de vehiculos
    const columnas = await queryInterface.describeTable('vehiculos');

    // Eliminar precio_hora solo si existe
    if (columnas.precio_hora) {
      await queryInterface.removeColumn(
        'vehiculos',
        'precio_hora'
      );
    }

    // Eliminar precio_dia solo si existe
    if (columnas.precio_dia) {
      await queryInterface.removeColumn(
        'vehiculos',
        'precio_dia'
      );
    }

  },

  async down(queryInterface, Sequelize) {

    // Obtener las columnas actuales
    const columnas = await queryInterface.describeTable('vehiculos');

    // Restaurar precio_hora solo si no existe
    if (!columnas.precio_hora) {
      await queryInterface.addColumn(
        'vehiculos',
        'precio_hora',
        {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 40
        }
      );
    }

    // Restaurar precio_dia solo si no existe
    if (!columnas.precio_dia) {
      await queryInterface.addColumn(
        'vehiculos',
        'precio_dia',
        {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 300
        }
      );
    }

  }
};
