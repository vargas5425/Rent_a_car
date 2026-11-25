'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pagos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      alquiler_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alquileres',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      metodo_pago: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      fecha_pago: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      tipo: {
        type: Sequelize.ENUM('ANTICIPO', 'PAGO_PARCIAL', 'TOTAL'),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pagos');
  }
};