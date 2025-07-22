const pool = require('./db'); // mysql2/promise or mssql-like pool

function parseMSSQLInputs(query, mssqlInputs = []) {
  const paramOrder = [];
  const cleanedQuery = query.replace(/@(\w+)/g, (_, name) => {
    paramOrder.push(name);
    return '?';
  });

  const orderedParams = paramOrder.map(name => {
    const input = mssqlInputs.find(i => i.name === name);
    if (!input) {
      console.error('Inputs passed:', mssqlInputs);
      throw new Error(`Missing input value for @${name}`);
    }
    return input.value === undefined ? null : input.value;
  });

  return { cleanedQuery, orderedParams };
}

// ⚡ Main function supporting both usage styles
function request(stringsOrQuery, ...values) {
  let query;
  let inputs = [];

  // If template string usage
  if (Array.isArray(stringsOrQuery)) {
    const paramNames = values.map((_, i) => `param${i}`);
    query = stringsOrQuery.reduce((acc, str, i) => acc + str + (paramNames[i] ? `@${paramNames[i]}` : ''), '');
    inputs = paramNames.map((name, i) => ({ name, value: values[i] }));
  } else {
    // Manual usage: requestSQL('SELECT ...').inputs({ key: val }).run()
    query = stringsOrQuery;
  }

  return {
    _inputs: inputs,

    inputs(inputObj) {
      this._inputs = Object.entries(inputObj).map(([name, value]) => ({ name, value }));
      return this;
    },

    async run() {
      const conn = await pool.getConnection();
      try {
        const { cleanedQuery, orderedParams } = parseMSSQLInputs(query, this._inputs);
        const [rows, meta] = await conn.execute(cleanedQuery, orderedParams);
        return {
          recordset: rows,
          rowsAffected: [meta?.affectedRows ?? rows.length]
        };
      } finally {
        conn.release();
      }
    }
  };
}

module.exports = {
  request
};
