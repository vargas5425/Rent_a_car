
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cargos_adicionales', {

      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      alquiler_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alquileres',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      tipo: {
        type: Sequelize.ENUM(
          'RETRASO',
          'COMBUSTIBLE',
          'DANIO',
          'LIMPIEZA',
          'KILOMETRAJE',
          'OTRO'
        ),
        allowNull: false
      },

      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      fecha_cargo: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    await queryInterface.addIndex(
      'cargos_adicionales',
      ['alquiler_id'],
      {
        name: 'idx_cargos_alquiler_id'
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cargos_adicionales');
  }
};
