// dbconfig.js
require('dotenv').config();
console.log('DB_SERVER:', process.env.DB_SERVER);
module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: 1433,
  options: {
    trustServerCertificate: true,
    encrypt: true
  }
};