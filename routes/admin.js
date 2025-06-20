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

// ✅ Create Admin (Allow first one without token)
router.post('/create', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Check if any admins exist
    const countResult = await pool.request().query('SELECT COUNT(*) AS count FROM Admins');
    const adminCount = countResult.recordset[0].count;

    // If admins exist, require token
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('fullname', sql.VarChar, fullname)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('role', sql.VarChar, role)
      .query('INSERT INTO Admins (fullname, email, password, role) VALUES (@fullname, @email, @password, @role)');

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    console.error('Create Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🟢 Login
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
    const isMatch = await bcrypt.compare(password, admin.Password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

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


// POST: Add Ledger Entry
router.post('/api/ledger-entry/:phoneno', async (req, res) => {
  const { phoneno, amount, remark } = req.body;
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



// Add Expense
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
});

module.exports = router;
