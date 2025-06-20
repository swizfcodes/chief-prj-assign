// db.js
const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'H1cadServer',
  server: 'DESKTOP-NIL5C6H\\SQL2022',
  database: 'ocdadatabase',
  port: 1433,
  options: {
    trustServerCertificate: true,
  }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();
const poolPromise = pool.connect();

module.exports = {
  sql,
  pool,
  poolConnect,
  poolPromise
};