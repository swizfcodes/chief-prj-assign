const sql = require('mssql');
const mysql = require('mysql2/promise');

// 1. Configure MSSQL
const mssqlConfig = {
  user: 'sa',
  password: 'H1cadServer',
  server: 'DESKTOP-NIL5C6H\\SQL2022',
  port: 1433,
  database: 'ocdadatabase',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// 2. Configure MySQL
const mysqlConfig = {
  host: 'localhost',
  user: 'Hicad',
  password: 'H1cadServer',
  database: 'ocdadatabase'
};

const tablesToMigrate = [
  'Admins',
  'HonTitle',
  'IncomeClassification',
  'memberledger',
  'Title',
  'oyinwards',
  'monthlysummary',
  'Notices',
  'ocdaexpenses',
  'Qualfication',
  'Stdxpenses',
  'State'
];

async function migrateTable(tableName) {
  try {
    const mssqlPool = await sql.connect(mssqlConfig);
    const mysqlConn = await mysql.createConnection(mysqlConfig);

    const result = await mssqlPool.request().query(`SELECT * FROM ${tableName}`);
    const rows = result.recordset;

    if (rows.length === 0) {
      console.log(`⚠️  No data in ${tableName}`);
      return;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(',');
    const insertQuery = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`;

    for (const row of rows) {
      const values = columns.map(col => row[col] === undefined ? null : row[col]);
      await mysqlConn.execute(insertQuery, values);
    }

    console.log(`✅ Migrated ${rows.length} rows to ${tableName}`);
  } catch (err) {
    console.error(`❌ Error migrating ${tableName}:`, err.message);
  }
}

(async () => {
  for (const table of tablesToMigrate) {
    await migrateTable(table);
  }

  console.log('🎉 All data migrated!');
  process.exit();
})();

