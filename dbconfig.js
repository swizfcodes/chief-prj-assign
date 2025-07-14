// dbconfig.js
require('dotenv').config();

console.log('DB_SERVER:', process.env.DB_SERVER);

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,  // Must be double-escaped in .env
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,                // Turn off encryption for local
    trustServerCertificate: true  // Trust self-signed certs (for local testing)
  }
};
