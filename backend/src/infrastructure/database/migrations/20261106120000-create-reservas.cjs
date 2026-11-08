'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservas', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      vehiculo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vehiculos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fecha_inicio: { type: Sequelize.DATE, allowNull: false },
      fecha_fin: { type: Sequelize.DATE, allowNull: false },
      modalidad: { type: Sequelize.ENUM('HORA', 'DIA', 'SEMANA', 'MES'), allowNull: false },
      // "Foto" del precio al momento de reservar: si el admin sube la tarifa mañana, esta reserva no cambia.
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      estado: {
        type: Sequelize.ENUM('RESERVADA', 'CONFIRMADA', 'ENTREGADA', 'DEVUELTA', 'FINALIZADA', 'CANCELADA'),
        allowNull: false,
        defaultValue: 'RESERVADA'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    // Acelera la consulta de solapamientos por vehículo y la de "mis reservas".
    await queryInterface.addIndex('reservas', ['vehiculo_id', 'fecha_inicio', 'fecha_fin'], {
      name: 'reservas_vehiculo_intervalo'
    });
    await queryInterface.addIndex('reservas', ['usuario_id'], { name: 'reservas_usuario' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('reservas');
  }
};
