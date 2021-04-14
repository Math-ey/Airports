const env = process.env;
require('dotenv/config');

const config = {
  db: { 
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT || '5432',
    user: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || process.env.DB_PASSWORD,
    database: env.DB_NAME || 'pdt',
  }
};

module.exports = config;