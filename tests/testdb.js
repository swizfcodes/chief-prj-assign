const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'pld112.truehost.cloud',
  user: 'qsjwzyzs_Hicad',
  password: 'H1cadServer123',
  database: 'qsjwzyzs_ocdadatabase',
  port: 3306,
  connectTimeout: 10000 // optional: give it 10 seconds to connect
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to Truehost MySQL as ID', connection.threadId);
});

module.exports = connection;
