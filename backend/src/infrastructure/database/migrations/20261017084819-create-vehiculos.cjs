'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehiculos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      placa: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      marca: { type: Sequelize.STRING(50), allowNull: false },
      modelo: { type: Sequelize.STRING(50), allowNull: false },
      anio: { type: Sequelize.INTEGER, allowNull: false },
      categoria_id: {
        type: Sequelize.INTEGER,
        references: { model: 'categorias', key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'SET NULL'
      },
      transmision: { type: Sequelize.ENUM('MANUAL', 'AUTOMATICA'), defaultValue: 'MANUAL' },
      pasajeros: { type: Sequelize.INTEGER, allowNull: false },
      kilometraje_actual: { type: Sequelize.INTEGER, defaultValue: 0 },
      estado: { type: Sequelize.ENUM('DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'MANTENIMIENTO'), defaultValue: 'DISPONIBLE' },
      imagen_url: { type: Sequelize.STRING(255) },
      activo: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehiculos');
  }
};