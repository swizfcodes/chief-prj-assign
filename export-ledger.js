const mysqldump = require('mysqldump');

mysqldump({
  connection: {
    host: 'localhost',
    user: 'Hicad',
    password: 'H1cadServer',
    database: 'ocdadatabase',
  },
  dump: {
    tables: ['memberledger'], // replace with your target table
    where: {
      memberledger: '1=1 LIMIT 16', // Export only first 16 rows
    },
  },
  dumpToFile: './memberledger_16rows_backup.sql',
});
