
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('alquileres', 'reserva_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'reservas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    await queryInterface.addIndex('alquileres', ['reserva_id'], {
      unique: true,
      name: 'uq_alquileres_reserva_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'alquileres',
      'uq_alquileres_reserva_id'
    );

    await queryInterface.removeColumn(
      'alquileres',
      'reserva_id'
    );
  }
};
