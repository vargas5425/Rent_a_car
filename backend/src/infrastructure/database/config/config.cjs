require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'rentacar',
    password: process.env.DB_PASSWORD || 'rentacar',
    database: process.env.DB_NAME || 'rentacar',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
};