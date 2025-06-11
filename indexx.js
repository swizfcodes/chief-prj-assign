const sql =  require("mssql/msnodesqlv8");
var config ={
  server : "DESKTOP-NIL5C6H\\SQL2022",
  database : "ocdadatabase",
  driver : "msnodesqlv8",
  user : "sa",
  password : "H1cadServer",
  options : {
    trustedConnection : true
  }
}

sql.connect(config, function(err) {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  console.log('✅ Database connected successfully');

  const request = new sql.Request();
  request.query('SELECT * FROM [ocdadatabase].[dbo].[news]', function(err, result) {
    if (err) {
      console.error('❌ Query failed:', err);
      return;
    }
    console.log('✅ Query executed successfully');
    console.log(result.recordset);
  });
});