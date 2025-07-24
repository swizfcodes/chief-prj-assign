const mysqldump = require('mysqldump');

mysqldump({
  connection: {
    host: 'localhost',
    user: 'Hicad',
    password: 'H1cadServer',
    database: 'ocdadatabase',
  },
  dumpToFile: './backup.sql',
});
