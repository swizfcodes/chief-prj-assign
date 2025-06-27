const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const config = require('../dbconfig'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET = 'your_jwt_secret';

// Middleware to parse JSON bodies
// Token verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
    req.adminId = decoded.id;
    next();
  });
};

// ✅ Create Admin (no password hashing)
router.post('/create', async (req, res) => {
  try {
    const pool = await poolPromise;

    const countResult = await pool.request().query('SELECT COUNT(*) AS count FROM Admins');
    const adminCount = countResult.recordset[0].count;

    if (adminCount > 0) {
      const token = req.headers['authorization'];
      if (!token) return res.status(403).json({ message: 'No token provided' });
      try {
        jwt.verify(token, SECRET);
      } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }

    const { fullname, email, password, role } = req.body;

    const check = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Admins WHERE email = @email');

    if (check.recordset.length > 0) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    await pool.request()
      .input('fullname', sql.VarChar, fullname)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password) // No hash
      .input('role', sql.VarChar, role)
      .query('INSERT INTO Admins (fullname, email, password, role) VALUES (@fullname, @email, @password, @role)');

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    console.error('Create Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🟢 Login (no password hashing)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Admins WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = result.recordset[0];
    if (password !== admin.Password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id }, SECRET, { expiresIn: '1d' });
    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { id: admin.id, fullname: admin.fullname, role: admin.role }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔄 List Admins
router.get('/list', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT id, fullname, email, role FROM Admins');
    res.json(result.recordset);
  } catch (err) {
    console.error('List Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✏️ Update Admin
router.put('/update/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, role } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('fullname', sql.VarChar, fullname)
      .input('email', sql.VarChar, email)
      .input('role', sql.VarChar, role)
      .query('UPDATE Admins SET fullname=@fullname, email=@email, role=@role WHERE id=@id');

    res.json({ message: 'Admin updated successfully' });
  } catch (err) {
    console.error('Update Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📊 Dashboard Data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;

    const [ledger, summary, expenses, std] = await Promise.all([
      pool.request().query('SELECT TOP (1000) phoneno, transdate, amount, remark FROM memberledger'),
      pool.request().query('SELECT TOP (1000) period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary'),
      pool.request().query('SELECT TOP (1000) docdate, project, remarks, amount FROM ocdaexpenses'),
      pool.request().query('SELECT TOP (1000) expscode, expsdesc FROM Stdxpenses')
    ]);

    res.json({
      ledger: ledger.recordset,
      summary: summary.recordset,
      expenses: expenses.recordset,
      std: std.recordset
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Connect to MSSQL once and reuse the connection
sql.connect(config).then(pool => {

  // GET /admin/memberledger
  router.get('/memberledger', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT phoneno, transdate, amount, remark FROM memberledger');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching member ledger:', err);
      res.status(500).json({ error: 'Failed to fetch member ledger' });
    }
  });

  // GET /admin/monthlysummary
  router.get('/monthlysummary', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching monthly summary:', err);
      res.status(500).json({ error: 'Failed to fetch monthly summary' });
    }
  });

  // GET /admin/ocdaexpenses
  router.get('/ocdaexpenses', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT docdate, project, remarks, amount FROM ocdaexpenses');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching OCDA expenses:', err);
      res.status(500).json({ error: 'Failed to fetch OCDA expenses' });
    }
  });

  // GET /admin/stdxpenses
  router.get('/stdxpenses', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT expscode, expsdesc FROM Stdxpenses');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching standard expenses:', err);
      res.status(500).json({ error: 'Failed to fetch standard expenses' });
    }
  });

}).catch(err => {
  console.error('Database connection failed:', err);
});


// create new member
router.post('/createmember', verifyToken, async (req, res) => {
  try {
    const {
      PhoneNumber, phoneno2, Surname, othernames, Title, HonTitle, Sex,
      Quarters, Ward, State, Town, DOB, Qualifications, Profession,
      exitdate, Password, email
    } = req.body;

    const pool = await poolPromise;
    const createdby = req.adminId; // From token
    const CreatedAt = new Date();

    await pool.request()
      .input('PhoneNumber', sql.VarChar, PhoneNumber)
      .input('phoneno2', sql.VarChar, phoneno2)
      .input('Surname', sql.VarChar, Surname)
      .input('othernames', sql.VarChar, othernames)
      .input('Title', sql.VarChar, Title)
      .input('HonTitle', sql.VarChar, HonTitle)
      .input('Sex', sql.VarChar, Sex)
      .input('Quarters', sql.VarChar, Quarters)
      .input('Ward', sql.VarChar, Ward)
      .input('State', sql.VarChar, State)
      .input('Town', sql.VarChar, Town)
      .input('DOB', sql.Date, DOB)
      .input('Qualifications', sql.VarChar, Qualifications)
      .input('Profession', sql.VarChar, Profession)
      .input('exitdate', sql.Date, exitdate || null)
      .input('Password', sql.VarChar, Password) // plaintext
      .input('CreatedAt', sql.DateTime, CreatedAt)
      .input('email', sql.VarChar, email)
      .input('createdby', sql.Int, createdby)
      .query(`
        INSERT INTO Members (PhoneNumber, phoneno2, Surname, othernames, Title, HonTitle, Sex, Quarters, Ward, State, Town,
          DOB, Qualifications, Profession, exitdate, Password, CreatedAt, email, createdby)
        VALUES (@PhoneNumber, @phoneno2, @Surname, @othernames, @Title, @HonTitle, @Sex, @Quarters, @Ward, @State, @Town,
          @DOB, @Qualifications, @Profession, @exitdate, @Password, @CreatedAt, @email, @createdby)
      `);

    res.status(201).json({ message: 'Member created successfully' });
  } catch (err) {
    console.error('Create Member Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Gemerate Monthly Summary
router.post('/generate-summary', verifyToken, async (req, res) => {
  try {
    const { year, month } = req.body;
    const paddedMonth = month.padStart(2, '0');
    const period = `${year}${paddedMonth}`; // 🔒 trim to 6-char format

    const pool = await poolPromise;

    // Check if already exists
    const exists = await pool.request()
      .input('period', sql.VarChar(6), period)
      .query('SELECT 1 FROM monthlysummary WHERE period = @period');

    if (exists.recordset.length > 0) {
      return res.status(409).json({ message: `Summary for ${period} already exists.` });
    }

    // Get credits and debits
    const [{ totalCredit }] = (await pool.request()
      .query(`SELECT ISNULL(SUM(amount), 0) AS totalCredit
              FROM memberledger 
              WHERE FORMAT(transdate, 'yyyyMM') = '${period}'`)
    ).recordset;

    const [{ totalDebit }] = (await pool.request()
      .query(`SELECT ISNULL(SUM(amount), 0) AS totalDebit
              FROM ocdaexpenses 
              WHERE FORMAT(docdate, 'yyyyMM') = '${period}'`)
    ).recordset;

    // Get previous net balance
    const [{ prevNet = 0 }] = (await pool.request()
      .query(`SELECT TOP 1 Netbalance AS prevNet
              FROM monthlysummary 
              WHERE period < '${period}' 
              ORDER BY period DESC`)
    ).recordset;

    const Netbalance = prevNet + totalCredit - totalDebit;

    await pool.request()
      .input('period', sql.VarChar(6), period)
      .input('openbalance', sql.Decimal(18, 2), prevNet)
      .input('Debitbalance', sql.Decimal(18, 2), totalDebit)
      .input('Creditbalance', sql.Decimal(18, 2), totalCredit)
      .input('Netbalance', sql.Decimal(18, 2), Netbalance)
      .query(`INSERT INTO monthlysummary (period, openbalance, Debitbalance, Creditbalance, Netbalance)
              VALUES (@period, @openbalance, @Debitbalance, @Creditbalance, @Netbalance)`);

    res.status(201).json({ message: 'Monthly summary saved' });
  } catch (err) {
    console.error('Monthly Summary Error:', err);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});



router.get('/monthlysummary', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`SELECT period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary ORDER BY period DESC`);
    res.json(result.recordset);
  } catch (err) {
    console.error('Summary Fetch Error:', err);
    res.status(500).json({ message: 'Failed to fetch monthly summary' });
  }
});



//show list of members
router.get('/members', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`SELECT gsmno, surname, othernames, title, sex, quarter, ward, state, email FROM Members ORDER BY surname`);
    res.json(result.recordset);
  } catch (err) {
    console.error('Fetch Members Error:', err);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Delete members
router.delete('/member/:phone', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const phone = req.params.phone;

    const result = await pool.request()
      .input('PhoneNumber', sql.VarChar, phone)
      .query('DELETE FROM Members WHERE PhoneNumber = @PhoneNumber');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('Delete Member Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET single member
router.get('/member/:phone', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('PhoneNumber', sql.VarChar, req.params.phone)
      .query('SELECT * FROM Members WHERE PhoneNumber = @PhoneNumber');

    if (result.recordset.length === 0) return res.status(404).json({ message: 'Member not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching member' });
  }
});

// PUT update member
router.put('/member/:phone', verifyToken, async (req, res) => {

    // Check if new phone exists and it's not the same as old
  if (req.body.PhoneNumber !== req.params.phone) {
    const check = await pool.request()
      .input('newPhone', sql.VarChar, req.body.PhoneNumber)
      .query('SELECT PhoneNumber FROM Members WHERE PhoneNumber = @newPhone');

    if (check.recordset.length > 0) {
      return res.status(409).json({ message: 'Phone number already in use by another member' });
    }
  }

  try {
    const fields = [
      'PhoneNumber', 'phoneno2', 'Surname', 'othernames', 'Title', 'HonTitle', 'Sex',
      'Quarters', 'Ward', 'State', 'Town', 'DOB', 'Qualifications',
      'Profession', 'exitdate', 'Password', 'email'
    ];

    const pool = await poolPromise;
    const request = pool.request();

    // Bind all fields
    fields.forEach(field => {
      request.input(field, sql.VarChar, req.body[field]);
    });

    request.input('oldPhone', sql.VarChar, req.params.phone);

    await request.query(`
      UPDATE Members SET
        PhoneNumber=@PhoneNumber,
        phoneno2=@phoneno2,
        Surname=@Surname,
        othernames=@othernames,
        Title=@Title,
        HonTitle=@HonTitle,
        Sex=@Sex,
        Quarters=@Quarters,
        Ward=@Ward,
        State=@State,
        Town=@Town,
        DOB=@DOB,
        Qualifications=@Qualifications,
        Profession=@Profession,
        exitdate=@exitdate,
        Password=@Password,
        email=@email
      WHERE PhoneNumber = @oldPhone
    `);

    res.json({ message: 'Member updated successfully' });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ message: 'Failed to update member' });
  }
});









// POST: Add Ledger Entry
router.post('/ledger-entry/:phoneno', async (req, res) => {
  const { amount, remark } = req.body;
  const phoneno = req.params.phoneno;

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .input('amount', sql.Decimal(18, 2), amount)
      .input('remark', sql.VarChar, remark)
      .query(`INSERT INTO memberledger (phoneno, amount, remark, transdate)
              VALUES (@phoneno, @amount, @remark, GETDATE())`);
              
    res.send({ success: true, message: 'Ledger entry added' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to save ledger entry' });
  }
});

// GET: Ledger Entries
router.get('/api/ledger-entry/:phoneno', async (req, res) => {
  const { phoneno } = req.params;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .query(`SELECT amount, remark, FORMAT(transdate, 'yyyy-MM-dd') AS transdate
              FROM memberledger WHERE phoneno = @phoneno ORDER BY transdate DESC`);
    res.send(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Could not fetch ledger entries' });
  }
});

// Add Expense with user-supplied date and project
router.post('/admin/ocdaexpenses', async (req, res) => {
  const { docdate, project, amount, remarks } = req.body;

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('docdate', sql.Date, docdate)
      .input('project', sql.VarChar, project)
      .input('remarks', sql.VarChar, remarks)
      .input('amount', sql.Decimal(18, 2), amount)
      .query(`
        INSERT INTO ocdaexpenses (docdate, project, remarks, amount)
        VALUES (@docdate, @project, @remarks, @amount)
      `);

    res.json({ success: true, message: 'OCDA expense saved' });
  } catch (err) {
    console.error('OCDA Expense Error:', err);
    res.status(500).json({ error: 'Failed to save OCDA expense' });
  }
});

router.get('/ocdaexpenses', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query(`
        SELECT TOP 1000
          FORMAT(docdate, 'yyyy-MM-dd') AS docdate,
          project,
          remarks,
          amount
        FROM ocdaexpenses
        ORDER BY docdate DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching OCDA expenses:', err);
    res.status(500).json({ error: 'Failed to fetch OCDA expenses' });
  }
});


// 🟢 GET: Populate dropdowns
router.get('/enquiry/options', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const [members, wards, quarters] = await Promise.all([
      pool.request().query("SELECT PhoneNumber, Surname + ' ' + othernames AS fullname FROM Members"),
      pool.request().query("SELECT DISTINCT Ward FROM Members WHERE Ward IS NOT NULL AND Ward <> ''"),
      pool.request().query("SELECT DISTINCT Quarters FROM Members WHERE Quarters IS NOT NULL AND Quarters <> ''")
    ]);

    res.json({
      members: members.recordset,
      wards: wards.recordset.map(w => w.Ward),
      quarters: quarters.recordset.map(q => q.Quarters)
    });
  } catch (err) {
    console.error('Dropdown Option Error:', err);
    res.status(500).json({ message: 'Failed to load options' });
  }
});

// 🟢 Main Enquiry Endpoint
router.get('/enquiry', verifyToken, async (req, res) => {
  const { type, param = 'ALL', mode = 'summary', start, end } = req.query;
  const pool = await poolPromise;
  let query = '';
  let where = [];

  try {
    if (type === 'member') {
      if (param !== 'ALL') where.push(`phoneno = '${param}'`);
      if (start) where.push(`transdate >= '${start}'`);
      if (end) where.push(`transdate <= '${end}'`);

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      query = mode === 'detail'
        ? `SELECT FORMAT(transdate, 'yyyy-MM-dd') AS transdate, amount, remark FROM memberledger ${whereClause} ORDER BY transdate DESC`
        : `SELECT phoneno, SUM(amount) AS total FROM memberledger ${whereClause} GROUP BY phoneno`;
    }

    else if (type === 'ward') {
      if (param !== 'ALL') where.push(`Ward = '${param}'`);
      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      query = mode === 'detail'
        ? `SELECT gsmno, Surname + ' ' + othernames AS fullname, email FROM Members ${whereClause} ORDER BY Surname`
        : `SELECT Ward, COUNT(*) AS members FROM Members ${whereClause} GROUP BY Ward`;
    }

    else if (type === 'quarter') {
      if (param !== 'ALL') where.push(`Quarters = '${param}'`);
      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      query = mode === 'detail'
        ? `SELECT gsmno, Surname + ' ' + othernames AS fullname, email FROM Members ${whereClause} ORDER BY Surname`
        : `SELECT Quarters, COUNT(*) AS members FROM Members ${whereClause} GROUP BY Quarters`;
    }

    else if (type === 'account') {
      const creditWhere = [];
      const debitWhere = [];

      if (start) creditWhere.push(`transdate >= '${start}'`);
      if (end) creditWhere.push(`transdate <= '${end}'`);
      if (start) debitWhere.push(`docdate >= '${start}'`);
      if (end) debitWhere.push(`docdate <= '${end}'`);

      const creditClause = creditWhere.length ? 'WHERE ' + creditWhere.join(' AND ') : '';
      const debitClause = debitWhere.length ? 'WHERE ' + debitWhere.join(' AND ') : '';

      query = `
        SELECT
          '${start || 'N/A'}' AS StartDate,
          '${end || 'N/A'}' AS EndDate,
          (SELECT ISNULL(SUM(amount), 0) FROM memberledger ${creditClause}) AS TotalCredit,
          (SELECT ISNULL(SUM(amount), 0) FROM ocdaexpenses ${debitClause}) AS TotalDebit
      `;
    }

    if (!query) return res.status(400).json({ message: 'Invalid enquiry type' });

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Enquiry Error:', err);
    res.status(500).json({ message: 'Failed to process enquiry' });
  }
});







/*// Add Expense
router.post('/api/expense/:phoneno', async (req, res) => {
  const { amount, remark } = req.body;
  const { phoneno } = req.params;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .input('amount', sql.Decimal(18, 2), amount)
      .input('remark', sql.VarChar, remark)
      .query(`INSERT INTO Stdxpenses (phoneno, amount, remark, transdate) VALUES (@phoneno, @amount, @remark, GETDATE())`);
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Expense error' });
  }
});

// Get Expenses
router.get('/api/expense/:phoneno', async (req, res) => {
  const { phoneno } = req.params;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .query(`SELECT FORMAT(transdate, 'yyyy-MM-dd') AS transdate, amount, remark
              FROM Stdxpenses WHERE phoneno = @phoneno ORDER BY transdate DESC`);
    res.send(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Expense fetch error' });
  }
});

// Generate Monthly Summary
router.post('/api/monthlysummary/:phoneno', async (req, res) => {
  const { phoneno } = req.params;
  const { period } = req.body;
  try {
    const pool = await sql.connect(config);
    const [{ totalLedger }] = (await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .input('period', sql.VarChar, `${period}%`)
      .query(`SELECT ISNULL(SUM(amount), 0) AS totalLedger FROM memberledger WHERE phoneno = @phoneno AND FORMAT(transdate, 'yyyy-MM') LIKE @period`)
    ).recordset;

    const [{ totalExpense }] = (await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .input('period', sql.VarChar, `${period}%`)
      .query(`SELECT ISNULL(SUM(amount), 0) AS totalExpense FROM Stdxpenses WHERE phoneno = @phoneno AND FORMAT(transdate, 'yyyy-MM') LIKE @period`)
    ).recordset;

    const last = await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .query(`SELECT TOP 1 Netbalance FROM monthlysummary WHERE phoneno = @phoneno ORDER BY period DESC`);

    const openBalance = last.recordset[0]?.Netbalance || 0;
    const netBalance = openBalance + totalLedger - totalExpense;

    await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .input('period', sql.VarChar, period)
      .input('openbalance', sql.Decimal(18, 2), openBalance)
      .input('debit', sql.Decimal(18, 2), totalExpense)
      .input('credit', sql.Decimal(18, 2), totalLedger)
      .input('net', sql.Decimal(18, 2), netBalance)
      .query(`INSERT INTO monthlysummary (phoneno, period, openbalance, Debitbalance, Creditbalance, Netbalance) VALUES (@phoneno, @period, @openbalance, @debit, @credit, @net)`);

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Summary generation failed' });
  }
});

// Get Monthly Summary
router.get('/api/monthlysummary/:phoneno', async (req, res) => {
  const { phoneno } = req.params;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .query(`SELECT period, openbalance, Creditbalance, Debitbalance, Netbalance FROM monthlysummary WHERE phoneno = @phoneno ORDER BY period DESC`);
    res.send(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Summary fetch failed' });
  }
});*/

module.exports = router;
