
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alquileres', {

      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      vehiculo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vehiculos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false
      },

      fecha_fin: {
        type: Sequelize.DATE,
        allowNull: false
      },

      fecha_entrega: {
        type: Sequelize.DATE,
        allowNull: true
      },

      fecha_devolucion: {
        type: Sequelize.DATE,
        allowNull: true
      },

      kilometraje_inicial: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      kilometraje_final: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      combustible_inicial: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      combustible_final: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      tarifa_diaria: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      monto_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      estado: {
        type: Sequelize.ENUM(
          'PENDIENTE',
          'ACTIVO',
          'FINALIZADO',
          'CANCELADO'
        ),
        allowNull: false,
        defaultValue: 'PENDIENTE'
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }

    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('alquileres');
  }
};
