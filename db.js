// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const config = require('./dbconfig');

// Create the pool using mysql2
const pool = mysql.createPool(config);

pool.getConnection()
  .then(conn => {
    console.log('✅ MYSQL DB connected successfully.');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MYSQL DB connection failed:', err);
  });

module.exports = pool;


/*{
  "mysqlOptions": {
    "authProtocol": "default",
    "enableSsl": "Disabled"
  },
  "previewLimit": 50,
  "server": "localhost",
  "port": 3306,
  "driver": "MySQL",
  "name": "MYSQL80-HICAD",
  "database": "sampledb",
  "username": "Hicad",
  "askForPassword": true
}*/
