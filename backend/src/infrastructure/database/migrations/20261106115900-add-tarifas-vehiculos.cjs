'use strict';

// Las reservas guardan una "foto" del precio, pero ese precio tiene que salir de algún lado:
// cada vehículo tiene su tarifa por hora y por día.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('vehiculos', 'precio_hora', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 40
    });
    await queryInterface.addColumn('vehiculos', 'precio_dia', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 300
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('vehiculos', 'precio_dia');
    await queryInterface.removeColumn('vehiculos', 'precio_hora');
  }
};
