import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// 👇 Lógica para elegir la base de datos según el entorno
const dbName = process.env.NODE_ENV === 'test' ? 'rentacar_test' : process.env.DB_NAME;

const sequelize = new Sequelize(
  dbName || 'rentacar',
  process.env.DB_USER || 'rentacar',
  process.env.DB_PASSWORD || 'rentacar',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

export default sequelize;