// db.js
const sql = require('mssql');

require('dotenv').config();

const config = require('./dbconfig');

// Create one shared pool connection (singleton)
const pool = new sql.ConnectionPool(config);

// Connect the pool once and export it
const poolPromise = pool.connect();
const poolConnect = pool.connect();

poolConnect.then(() => {
  console.log('✅ Azure SQL connected successfully.');
}).catch(err => {
  console.error('❌ Azure SQL connection failed:', err);
});

module.exports = {
  sql,
  pool,
  poolPromise,
  poolConnect
};
