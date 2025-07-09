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
  const bearerHeader = req.headers['authorization'];

  if (!bearerHeader) {
    return res.status(403).json({ message: 'No token provided' });
  }

  const token = bearerHeader.split(' ')[1]; // Removes "Bearer " part

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    req.adminId = decoded.id; // ✅ Attach to request
    next();
  });
};

// Create Admin (no password hashing)
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

// Activate admin
router.patch('/activate/:id', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Admins SET active = 1 WHERE id = @id');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin activated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate admin
router.patch('/deactivate/:id', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Admins SET active = 0 WHERE id = @id');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete admin
router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Admins WHERE id = @id');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

//  Login (no password hashing)
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
    if (admin.active === 0 || admin.active === false || admin.active === '0') {
      return res.status(403).json({ message: 'Account is deactivated. Please contact a superadmin.' });
    }

    const token = jwt.sign({ id: admin.Id }, SECRET, { expiresIn: '1d' });
    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { id: admin.Id, fullname: admin.fullname, role: admin.role }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/login', (req, res) => {
  res.status(405).json({ message: 'Use POST to log in.' });
});




//  List Admins
router.get('/list', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT Id, fullname, email, role, active FROM Admins');
    res.json(result.recordset);
  } catch (err) {
    console.error('List Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//  Update Admin
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

// Dashboard Data
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
  router.get('/memberledger', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query(`
      SELECT 
        phoneno, 
        FORMAT(transdate, 'yyyy-MM-dd') AS transdate,
        amount, 
        remark, 
        FORMAT(paydate, 'yyyy-MM-dd') AS paydate
      FROM memberledger
      ORDER BY transdate DESC
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching member ledger:', err);
      res.status(500).json({ error: 'Failed to fetch member ledger' });
    }
  });

  // GET /admin/monthlysummary
  router.get('/monthlysummary', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching monthly summary:', err);
      res.status(500).json({ error: 'Failed to fetch monthly summary' });
    }
  });

  // GET /admin/ocdaexpenses
  router.get('/ocdaexpenses', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT docdate, project, remarks, amount FROM ocdaexpenses');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching OCDA expenses:', err);
      res.status(500).json({ error: 'Failed to fetch OCDA expenses' });
    }
  });

  // GET /admin/stdxpenses
  router.get('/stdxpenses', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT expscode, expsdesc FROM Stdxpenses');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching standard expenses:', err);
      res.status(500).json({ error: 'Failed to fetch standard expenses' });
    }
  });

// GET /admin/incomeclassifications
router.get('/incomeclass', verifyToken, async (req, res) => {
  try {
    const result = await pool.request().query('SELECT incomecode, incomedesc FROM IncomeClassification');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching income classifications:', err);
    res.status(500).json({ error: 'Failed to fetch income classifications' });
  }
});

 // GET /admin/monthlysummary
  router.get('/monthlysummary', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching monthly summary:', err);
      res.status(500).json({ error: 'Failed to fetch monthly summary' });
    }
  });

  // GET /admin/ocdaexpenses
  router.get('/ocdaexpenses', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT docdate, project, remarks, amount FROM ocdaexpenses');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching OCDA expenses:', err);
      res.status(500).json({ error: 'Failed to fetch OCDA expenses' });
    }
  });

  // GET /admin/stdxpenses
  router.get('/stdxpenses', verifyToken, async (req, res) => {
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
    const period = `${year}${paddedMonth}`; 

    // Get today's date and calculate last month
    const now = new Date();
    const thisMonth = now.getMonth() + 1; // 
    const thisYear = now.getFullYear();
    let lastMonth = thisMonth - 1;
    let lastMonthYear = thisYear;
    if (lastMonth === 0) {
      lastMonth = 12;
      lastMonthYear = thisYear - 1;
    }
    const lastPeriod = `${lastMonthYear}${String(lastMonth).padStart(2, '0')}`; // e.g. 202406

    // Only allow if period <= lastPeriod (not current/future), and not already done
    if (parseInt(period) > parseInt(lastPeriod)) {
      return res.status(400).json({ message: 'You can only generate summary for the previous or earlier months.' });
    }

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
    const prevResult = await pool.request()
      .query(`SELECT TOP 1 Netbalance AS prevNet
              FROM monthlysummary 
              WHERE period < '${period}' 
              ORDER BY period DESC`);
    const prevNet = prevResult.recordset.length > 0 ? prevResult.recordset[0].prevNet : 0;

    const Netbalance = prevNet + totalCredit - totalDebit;

    await pool.request()
      .input('period', sql.VarChar(6), period)
      .input('openbalance', sql.Decimal(18, 2), prevNet)
      .input('Debitbalance', sql.Decimal(18, 2), totalCredit)      // <-- swapped
      .input('Creditbalance', sql.Decimal(18, 2), totalDebit)      // <-- swapped
      .input('Netbalance', sql.Decimal(18, 2), Netbalance)
      .query(`INSERT INTO monthlysummary (period, openbalance, Debitbalance, Creditbalance, Netbalance)
      VALUES (@period, @openbalance, @Debitbalance, @Creditbalance, @Netbalance)`);

    const newSummary = await pool.request()
    .input('period', sql.VarChar(6), period)
    .query('SELECT period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary WHERE period = @period');

    res.status(201).json({
      message: 'Monthly summary saved',
      summary: newSummary.recordset[0]
    });
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
      .query(`
        SELECT 
          PhoneNumber, Surname, othernames, Title, Sex, Quarters, Ward, 
          State, Town, DOB, Profession, Qualifications, email
        FROM Members
        ORDER BY surname
      `);
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
  try {
    const pool = await poolPromise;

    // Get the existing member
    const existingResult = await pool.request()
      .input('PhoneNumber', sql.VarChar, req.params.phone)
      .query('SELECT * FROM Members WHERE PhoneNumber = @PhoneNumber');
    if (existingResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
    const existing = existingResult.recordset[0];

    //  If phone number is changing, check for conflicts
    if (req.body.PhoneNumber && req.body.PhoneNumber !== req.params.phone) {
      const check = await pool.request()
        .input('newPhone', sql.VarChar, req.body.PhoneNumber)
        .query('SELECT PhoneNumber FROM Members WHERE PhoneNumber = @newPhone');
      if (check.recordset.length > 0) {
        return res.status(409).json({ message: 'Phone number already in use by another member' });
      }
    }

    // Merge fields: use req.body if present, else existing value
    const fields = [
      'PhoneNumber', 'phoneno2', 'Surname', 'othernames', 'Title', 'HonTitle', 'Sex',
      'Quarters', 'Ward', 'State', 'Town', 'DOB', 'Qualifications',
      'Profession', 'exitdate', 'Password', 'email'
    ];

    const merged = {};
    fields.forEach(field => {
      // For date fields, set to null if empty or not provided
      fields.forEach(field => {
        if (field === 'DOB' || field === 'exitdate') {
          if (req.body[field] === undefined) {
            merged[field] = existing[field];
          } else if (req.body[field] === '') {
            merged[field] = null;
          } else {
            merged[field] = req.body[field];
          }
        } else {
          merged[field] = req.body[field] !== undefined ? req.body[field] : existing[field];
        }
      });
    });


    // Bind all fields
    const request = pool.request();
    fields.forEach(field => {
      if (field === 'DOB' || field === 'exitdate') {
        request.input(field, sql.Date, merged[field]);
      } else {
        request.input(field, sql.VarChar, merged[field]);
      }
    });
    request.input('oldPhone', sql.VarChar, req.params.phone);

    // Update
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
router.post('/ledger-entry/:phoneno', verifyToken, async (req, res) => {
  const { phoneno } = req.params;
  const { transdate, amount, remark } = req.body;

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('phoneno', sql.VarChar, phoneno)
      .input('transdate', sql.Date, transdate) 
      .input('amount', sql.Decimal(18, 2), amount)
      .input('remark', sql.VarChar, remark)
      .query(`INSERT INTO memberledger (phoneno, transdate, amount, remark, paydate)
              VALUES (@phoneno, @transdate, @amount, @remark, CAST(GETDATE() AS DATE))`);

    res.status(200).json({ message: 'Ledger entry recorded successfully' });
  } catch (err) {
    console.error('Ledger insert error:', err);
    res.status(500).json({ message: 'Failed to record ledger entry' });
  }
});

// GET: Ledger Entries
router.get('/api/ledger-entry/:phoneno', verifyToken, async (req, res) => {
  const { phoneno } = req.params;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
    .input('phoneno', sql.VarChar, phoneno)
    .query(`SELECT 
              amount, 
              FORMAT(transdate, 'yyyy-MM-dd') AS transdate,
              amount, 
              remark, 
              FORMAT(paydate, 'yyyy-MM-dd') AS paydate
            FROM memberledger 
            WHERE phoneno = @phoneno 
            ORDER BY transdate DESC`);;
    res.send(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Could not fetch ledger entries' });
  }
});

// Add Expense with user-supplied date and project
router.post('/ocdaexpenses', verifyToken, async (req, res) => {
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

// GET: Project List for Dropdown
router.get('/project-list', verifyToken, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT expscode, expsdesc FROM Stdxpenses ORDER BY expsdesc');
    res.json(result.recordset);
  } catch (err) {
    console.error('Project List Load Error:', err);
    res.status(500).json({ error: 'Failed to load project list' });
  }
});

router.get('/ocdaexpenses', verifyToken, async (req, res) => {
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


// GET: Populate dropdowns
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

// Helper to apply optional date filters
const whereDate = (dateField, start, end) => {
  const clauses = [];
  if (start) clauses.push(`${dateField} >= '${start}'`);
  if (end) clauses.push(`${dateField} <= '${end}'`);
  return clauses.length ? ' AND ' + clauses.join(' AND ') : '';
};

// Main Enquiry Endpoint (updated)
router.get('/enquiry', verifyToken, async (req, res) => {
  const { type, param = 'ALL', mode = 'summary', start, end } = req.query;
  const pool = await poolPromise;
  let summary = [];
  let detail = [];

  try {
    // MEMBER
    if (type === 'member') {
      const dateFilter = whereDate('transdate', start, end);

      if (param === 'ALL') {
        // List all members with total transactions
        summary = await pool.request().query(`
          SELECT m.PhoneNumber, m.Surname + ' ' + m.othernames AS fullname, ISNULL(SUM(l.amount), 0) AS total
          FROM Members m
          LEFT JOIN memberledger l ON m.PhoneNumber = l.phoneno ${dateFilter ? `AND 1=1${dateFilter}` : ''}
          GROUP BY m.PhoneNumber, m.Surname, m.othernames
          ORDER BY fullname
        `).then(r => r.recordset);

        // Sum for ALL
        const allTotal = summary.reduce((sum, row) => sum + Number(row.total), 0);
        summary.push({ PhoneNumber: 'ALL', fullname: 'ALL', total: allTotal });

        if (mode === 'detail') {
          // All member transactions (for right side)
          detail = await pool.request().query(`
            SELECT l.phoneno, m.Surname + ' ' + m.othernames AS fullname, FORMAT(l.transdate, 'yyyy-MM-dd') AS transdate, l.amount, l.remark
            FROM memberledger l
            LEFT JOIN Members m ON l.phoneno = m.PhoneNumber
            ${dateFilter ? `WHERE 1=1${dateFilter}` : ''}
            ORDER BY l.phoneno, l.transdate DESC
          `).then(r => r.recordset);
        }
      } else {
        // Single member as before
        const filter = `phoneno = '${param}'`;
        const whereClause = `WHERE ${filter}${dateFilter}`;
        if (mode === 'summary') {
          summary = await pool.request().query(`
            SELECT l.phoneno, m.Surname + ' ' + m.othernames AS fullname, SUM(l.amount) AS total
            FROM memberledger l
            LEFT JOIN Members m ON l.phoneno = m.PhoneNumber
            ${whereClause}
            GROUP BY l.phoneno, m.Surname, m.othernames
          `).then(r => r.recordset);
        } else {
          detail = await pool.request().query(`
            SELECT l.phoneno, m.Surname + ' ' + m.othernames AS fullname, FORMAT(l.transdate, 'yyyy-MM-dd') AS transdate, l.amount, l.remark
            FROM memberledger l
            LEFT JOIN Members m ON l.phoneno = m.PhoneNumber
            ${whereClause}
            ORDER BY l.transdate DESC
          `).then(r => r.recordset);
          summary = [{
            phoneno: param,
            fullname: detail[0]?.fullname || '',
            total: detail.reduce((sum, row) => sum + parseFloat(row.amount), 0)
          }];
        }
      }
    }

    // WARD
    else if (type === 'ward') {
      const dateFilter = whereDate('transdate', start, end);

      if (param === 'ALL') {
        // List all wards with total transactions
        summary = await pool.request().query(`
          SELECT m.Ward, ISNULL(SUM(l.amount), 0) AS total
          FROM Members m
          LEFT JOIN memberledger l ON m.PhoneNumber = l.phoneno ${dateFilter ? `AND 1=1${dateFilter}` : ''}
          WHERE m.Ward IS NOT NULL AND m.Ward <> ''
          GROUP BY m.Ward
          ORDER BY m.Ward
        `).then(r => r.recordset);

        // Sum for ALL
        const allTotal = summary.reduce((sum, row) => sum + Number(row.total), 0);
        summary.push({ Ward: 'ALL', total: allTotal });

        if (mode === 'detail') {
          // For each ward, list member transactions
          const wards = summary.filter(w => w.Ward !== 'ALL').map(w => w.Ward);
          for (const ward of wards) {
            const members = await pool.request()
              .input('ward', ward)
              .query(`
                SELECT l.phoneno, m.Surname + ' ' + m.othernames AS fullname, FORMAT(l.transdate, 'yyyy-MM-dd') AS transdate, l.amount, l.remark
                FROM memberledger l
                LEFT JOIN Members m ON l.phoneno = m.PhoneNumber
                WHERE m.Ward = @ward ${dateFilter}
                ORDER BY l.phoneno, l.transdate DESC
              `)
              .then(r => r.recordset);
            if (ward && members && members.length > 0) {
              detail.push({ ward, members });
            }
          }
        }
      } else {
        // Single ward as before
        const wardClause = `Ward = '${param}'`;
        const memberList = await pool.request().query(`SELECT PhoneNumber FROM Members WHERE ${wardClause}`);
        const phones = memberList.recordset.map(m => `'${m.PhoneNumber}'`);
        const phoneFilter = phones.length ? `l.phoneno IN (${phones.join(',')})` : '1=0';
        const transFilter = `WHERE ${phoneFilter}${dateFilter}`;

        summary = await pool.request().query(`
          SELECT '${param}' AS Ward, SUM(l.amount) AS total
          FROM memberledger l
          ${transFilter}
        `).then(r => r.recordset);

        if (mode === 'detail') {
          const members = await pool.request().query(`
            SELECT l.phoneno, m.Surname + ' ' + m.othernames AS fullname, FORMAT(l.transdate, 'yyyy-MM-dd') AS transdate, l.amount, l.remark
            FROM memberledger l
            LEFT JOIN Members m ON l.phoneno = m.PhoneNumber
            ${transFilter}
            ORDER BY l.phoneno, l.transdate DESC
          `).then(r => r.recordset);
          detail = [{ ward: param, members }];
        }
      }
    }

    // QUARTER
    else if (type === 'quarter') {
      const dateFilter = whereDate('transdate', start, end);

      if (param === 'ALL') {
        // List all quarters with total transactions
        summary = await pool.request().query(`
          SELECT m.Quarters, ISNULL(SUM(l.amount), 0) AS total
          FROM Members m
          LEFT JOIN memberledger l ON m.PhoneNumber = l.phoneno ${dateFilter ? `AND 1=1${dateFilter}` : ''}
          WHERE m.Quarters IS NOT NULL AND m.Quarters <> ''
          GROUP BY m.Quarters
          ORDER BY m.Quarters
        `).then(r => r.recordset);

        // Sum for ALL
        const allTotal = summary.reduce((sum, row) => sum + Number(row.total), 0);
        summary.push({ Quarters: 'ALL', total: allTotal });

        if (mode === 'detail') {
          // For each quarter, list wards and under each ward, list member transactions
          const quarters = summary.filter(q => q.Quarters !== 'ALL').map(q => q.Quarters);
          for (const quarter of quarters) {
            // Get wards in this quarter
            const wardsResult = await pool.request()
              .input('quarter', quarter)
              .query(`SELECT DISTINCT Ward FROM Members WHERE Quarters = @quarter`);
            const wards = wardsResult.recordset.map(w => w.Ward);

            const wardsData = [];
            for (const ward of wards) {
              const members = await pool.request()
                .input('ward', ward)
                .input('quarter', quarter)
                .query(`
                  SELECT l.phoneno, m.Surname + ' ' + m.othernames AS fullname, FORMAT(l.transdate, 'yyyy-MM-dd') AS transdate, l.amount, l.remark
                  FROM memberledger l
                  LEFT JOIN Members m ON l.phoneno = m.PhoneNumber
                  WHERE m.Ward = @ward AND m.Quarters = @quarter ${dateFilter}
                  ORDER BY l.phoneno, l.transdate DESC
                `)
                .then(r => r.recordset);
              wardsData.push({ ward, members });
            }
            detail.push({ quarter, wards: wardsData });
          }
        }
      } else {
        // Single quarter as before
        const qClause = `Quarters = '${param}'`;
        const wardsResult = await pool.request().query(`SELECT DISTINCT Ward FROM Members WHERE ${qClause}`);
        const wards = wardsResult.recordset.map(w => w.Ward);

        const phonesResult = await pool.request().query(`SELECT PhoneNumber, Ward FROM Members WHERE ${qClause}`);
        const phonesByWard = phonesResult.recordset.reduce((acc, row) => {
          acc[row.Ward] = acc[row.Ward] || [];
          acc[row.Ward].push(`'${row.PhoneNumber}'`);
          return acc;
        }, {});

        const allPhones = Object.values(phonesByWard).flat().join(',');
        const phoneFilter = allPhones.length ? `phoneno IN (${allPhones})` : '1=0';

        summary = await pool.request().query(`
          SELECT '${param}' AS Quarter, SUM(amount) AS total
          FROM memberledger
          WHERE ${phoneFilter}${dateFilter}
        `).then(r => r.recordset);

        if (mode === 'detail') {
          const wardsData = [];
          for (const ward of wards) {
            const phones = phonesByWard[ward] || [];
            if (phones.length === 0) continue;

            // Get all transactions for this ward
            const members = await pool.request().query(`
              SELECT l.phoneno, m.Surname + ' ' + m.othernames AS fullname, FORMAT(l.transdate, 'yyyy-MM-dd') AS transdate, l.amount, l.remark
              FROM memberledger l
              LEFT JOIN Members m ON l.phoneno = m.PhoneNumber
              WHERE l.phoneno IN (${phones.join(',')})${dateFilter}
              ORDER BY l.phoneno, l.transdate DESC
            `).then(r => r.recordset);

            wardsData.push({ ward, members });
          }
          detail = [{ quarter: param, wards: wardsData }];
        }
      }
    }

    // ACCOUNT (unchanged)
    else if (type === 'account') {
      const creditFilter = whereDate('transdate', start, end);
      const debitFilter = whereDate('docdate', start, end);

      summary = await pool.request().query(`
        SELECT
          '${start || 'N/A'}' AS StartDate,
          '${end || 'N/A'}' AS EndDate,
          (SELECT ISNULL(SUM(amount), 0) FROM memberledger WHERE 1=1${creditFilter}) AS TotalCredit,
          (SELECT ISNULL(SUM(amount), 0) FROM ocdaexpenses WHERE 1=1${debitFilter}) AS TotalDebit
      `).then(r => r.recordset);
    }

    return res.json({ summary, detail });
  } catch (err) {
    console.error('Enquiry Error:', err);
    return res.status(500).json({ message: 'Failed to process enquiry' });
  }
});

//Static Tables
//  GET all 
router.get('/static/:type', async (req, res) => {
  const { type } = req.params;
  const tableMap = {
    titles: { table: 'Title', columns: ['title'] },
    qualifications: { table: 'Qualfication', columns: ['qualification'] },
    wards: { table: 'oyinwards', columns: ['ward', 'Quarter'] },
    hontitles: { table: 'HonTitle', columns: ['Htitle', 'titlerank'] }
  };
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });

  try {
    const pool = await poolPromise;
    const cols = config.columns.join(', ');
    const result = await pool.request().query(`SELECT ${cols} FROM ${config.table}`);
    res.json(result.recordset);
  } catch (err) {
    console.error(`Error fetching ${type}:`, err);
    res.status(500).json({ error: `Failed to fetch ${type}` });
  }
});

// --- POST (Add) ---
router.post('/static/:type', async (req, res) => {
  const { type } = req.params;
  const tableMap = {
    titles: { table: 'Title', columns: ['title'] },
    qualifications: { table: 'Qualfication', columns: ['qualification'] },
    wards: { table: 'oyinwards', columns: ['ward', 'Quarter'] },
    hontitles: { table: 'HonTitle', columns: ['Htitle', 'titlerank'] }
  };
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });

  try {
    const pool = await poolPromise;
    const values = config.columns.map(col => req.body[col]);
    const placeholders = config.columns.map((_, i) => `@val${i}`).join(', ');
    const request = pool.request();
    config.columns.forEach((col, i) => request.input(`val${i}`, values[i]));
    await request.query(`INSERT INTO ${config.table} (${config.columns.join(', ')}) VALUES (${placeholders})`);
    res.json({ success: true });
  } catch (err) {
    console.error(`Error inserting into ${type}:`, err);
    res.status(500).json({ error: `Failed to insert into ${type}` });
  }
});

// --- PUT (Edit) ---
router.put('/static/:type', async (req, res) => {
  const { type } = req.params;
  const tableMap = {
    titles: { table: 'Title', columns: ['title'] },
    qualifications: { table: 'Qualfication', columns: ['qualification'] },
    wards: { table: 'oyinwards', columns: ['ward', 'Quarter'] },
    hontitles: { table: 'HonTitle', columns: ['Htitle', 'titlerank'] }
  };
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });

  try {
    const pool = await poolPromise;
    let where = '';
    let request = pool.request();

    if (type === 'wards') {
      const { ward, Quarter } = req.query;
      where = 'WHERE ward = @ward AND Quarter = @Quarter';
      request.input('ward', ward).input('Quarter', Quarter);
    } else if (type === 'hontitles') {
      const { Htitle, titlerank } = req.query;
      where = 'WHERE Htitle = @Htitle AND titlerank = @titlerank';
      request.input('Htitle', Htitle).input('titlerank', titlerank);
    } else if (type === 'titles') {
      const { value } = req.query;
      where = 'WHERE title = @value';
      request.input('value', value);
    } else if (type === 'qualifications') {
      const { value } = req.query;
      where = 'WHERE qualification = @value';
      request.input('value', value);
    }

    // Build SET clause
    const setClause = config.columns.map(col => `${col} = @new_${col}`).join(', ');
    config.columns.forEach(col => request.input(`new_${col}`, req.body[col]));

    await request.query(`UPDATE ${config.table} SET ${setClause} ${where}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`Error updating ${type}:`, err);
    res.status(500).json({ error: `Failed to update ${type}` });
  }
});

// --- DELETE ---
router.delete('/static/:type', async (req, res) => {
  const { type } = req.params;
  const tableMap = {
    titles: { table: 'Title', columns: ['title'] },
    qualifications: { table: 'Qualfication', columns: ['qualification'] },
    wards: { table: 'oyinwards', columns: ['ward', 'Quarter'] },
    hontitles: { table: 'HonTitle', columns: ['Htitle', 'titlerank'] }
  };
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });

  try {
    const pool = await poolPromise;
    let where = '';
    let request = pool.request();

    if (type === 'wards') {
      const { ward, Quarter } = req.query;
      where = 'WHERE ward = @ward AND Quarter = @Quarter';
      request.input('ward', ward).input('Quarter', Quarter);
    } else if (type === 'hontitles') {
      const { Htitle, titlerank } = req.query;
      where = 'WHERE Htitle = @Htitle AND titlerank = @titlerank';
      request.input('Htitle', Htitle).input('titlerank', titlerank);
    } else if (type === 'titles') {
      const { value } = req.query;
      where = 'WHERE title = @value';
      request.input('value', value);
    } else if (type === 'qualifications') {
      const { value } = req.query;
      where = 'WHERE qualification = @value';
      request.input('value', value);
    }

    await request.query(`DELETE FROM ${config.table} ${where}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`Error deleting from ${type}:`, err);
    res.status(500).json({ error: `Failed to delete from ${type}` });
  }
});


//Standard Expenses
// GET all
router.get('/stdxpenses', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT expscode, expsdesc FROM stdxpenses');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// POST
router.post('/stdxpenses', async (req, res) => {
  const { expscode, expsdesc } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('expscode', expscode)
      .input('expsdesc', expsdesc)
      .query('INSERT INTO stdxpenses (expscode, expsdesc) VALUES (@expscode, @expsdesc)');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Insert failed' });
  }
});

// PUT
router.put('/stdxpenses', async (req, res) => {
  const { expscode } = req.query;
  const { expsdesc } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('expscode', expscode)
      .input('expsdesc', expsdesc)
      .query('UPDATE stdxpenses SET expsdesc = @expsdesc WHERE expscode = @expscode');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// DELETE
router.delete('/stdxpenses', async (req, res) => {
  const { expscode } = req.query;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('expscode', expscode)
      .query('DELETE FROM stdxpenses WHERE expscode = @expscode');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});


// POST income class
router.post('/incomeclass', async (req, res) => {
  const { incomecode, incomedesc } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('incomecode', incomecode)
      .input('incomedesc', incomedesc)
      .query('INSERT INTO IncomeClassification (incomecode, incomedesc) VALUES (@incomecode, @incomedesc)');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Insert failed' });
  }
});

// PUT
router.put('/incomeclass', async (req, res) => {
  const { incomecode } = req.query;
  const { incomedesc } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('incomecode', incomecode)
      .input('incomedesc', incomedesc)
      .query('UPDATE IncomeClassification SET incomedesc = @incomedesc WHERE incomecode = @incomecode');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// DELETE
router.delete('/incomeclass', async (req, res) => {
  const { incomecode } = req.query;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('incomecode', incomecode)
      .query('DELETE FROM IncomeClassification WHERE incomecode = @incomecode');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ===== OCDA Expenses Analysis API (MSSQL version) =====
router.get('/ocda-expenses-analysis', verifyToken, async (req, res) => {
  try {
    const { start, end, code = 'ALL', mode = 'summary' } = req.query;
    const pool = await poolPromise;
    let where = [];
    if (start) where.push(`docdate >= @start`);
    if (end) where.push(`docdate <= @end`);
    if (code && code !== 'ALL') where.push(`e.project = @code`);
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const request = pool.request();
    if (start) request.input('start', sql.Date, start);
    if (end) request.input('end', sql.Date, end);
    if (code && code !== 'ALL') request.input('code', sql.VarChar, code);

    if (mode === 'summary') {
      const result = await request.query(`
        SELECT 
          e.project AS code, 
          s.expsdesc AS description, 
          SUM(e.amount) AS amount
        FROM ocdaexpenses e
        LEFT JOIN stdxpenses s ON e.project = s.expscode
        ${whereClause}
        GROUP BY e.project, s.expsdesc
        ORDER BY e.project
      `);
      res.json(result.recordset);
    } else {
      const result = await request.query(`
        SELECT 
          e.project AS code,
          s.expsdesc AS description,
          FORMAT(e.docdate, 'yyyy-MM-dd') AS date, 
          e.remarks AS remark, 
          e.amount
        FROM ocdaexpenses e
        LEFT JOIN stdxpenses s ON e.project = s.expscode
        ${whereClause}
        ORDER BY e.project, e.docdate
      `);
      res.json(result.recordset);
    }
  } catch (err) {
    console.error('OCDA Expenses Analysis error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== OCDA Income Analysis API (MSSQL version) =====
router.get('/ocda-income-analysis', verifyToken, async (req, res) => {
  try {
    const { start, end, code = 'ALL', mode = 'summary' } = req.query;
    const pool = await poolPromise;
    let where = [];
    if (start) where.push(`transdate >= @start`);
    if (end) where.push(`transdate <= @end`);
    if (code && code !== 'ALL') where.push(`remark LIKE @code`);
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    if (mode === 'summary') {
      // Group by remark (income code/desc)
      const result = await pool.request()
        .input('start', sql.Date, start || null)
        .input('end', sql.Date, end || null)
        .input('code', sql.VarChar, code !== 'ALL' ? `%${code}%` : null)
        .query(`SELECT remark as code, MAX(remark) as description, SUM(amount) as amount FROM memberledger ${whereClause} GROUP BY remark`);
      res.json(result.recordset);
    } else {
      // Detail: list all matching income entries
      const result = await pool.request()
        .input('start', sql.Date, start || null)
        .input('end', sql.Date, end || null)
        .input('code', sql.VarChar, code !== 'ALL' ? `%${code}%` : null)
        .query(`SELECT FORMAT(transdate, 'yyyy-MM-dd') as date, remark, amount FROM memberledger ${whereClause} ORDER BY transdate`);
      res.json(result.recordset);
    }
  } catch (err) {
    console.error('OCDA Income Analysis error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/members-summary
router.get('/members-summary', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    // Fetch all members with quarters and wards
    const result = await pool.request().query(`
      SELECT Quarters, Ward
      FROM Members
      WHERE Quarters IS NOT NULL AND Quarters <> ''
        AND Ward IS NOT NULL AND Ward <> ''
    `);
    const members = result.recordset;

    // Get unique quarters and wards
    const quartersSet = new Set();
    const wardsSet = new Set();
    members.forEach(m => {
      quartersSet.add(m.Quarters);
      wardsSet.add(m.Ward);
    });
    const quarters = Array.from(quartersSet).sort();
    const wards = Array.from(wardsSet).sort();

    // Build summary data: { [ward]: { [quarter]: count } }
    const data = {};
    wards.forEach(ward => {
      data[ward] = {};
      quarters.forEach(quarter => {
        data[ward][quarter] = 0;
      });
    });
    members.forEach(m => {
      if (data[m.Ward] && data[m.Ward][m.Quarters] !== undefined) {
        data[m.Ward][m.Quarters] += 1;
      }
    });

    // Optionally, add totals per ward and per quarter
    const wardTotals = {};
    wards.forEach(ward => {
      wardTotals[ward] = quarters.reduce((sum, q) => sum + data[ward][q], 0);
    });
    const quarterTotals = {};
    quarters.forEach(quarter => {
      quarterTotals[quarter] = wards.reduce((sum, w) => sum + data[w][quarter], 0);
    });
    const grandTotal = members.length;

    res.json({ wards, quarters, data, wardTotals, quarterTotals, grandTotal });
  } catch (err) {
    console.error('Fetch Members Summary Error:', err);
    res.status(500).json({ message: 'Failed to fetch members summary' });
  }
});

// POST: Create notice/event
router.post('/notices', verifyToken, async (req, res) => {
  const { title, content, type } = req.body;
  const created_by = req.adminId;
  console.log('adminId:', created_by, 'payload:', req.body);
  if (!title || !content || !type) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!created_by) {
    return res.status(401).json({ message: 'Invalid or missing admin token.' });
  }
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('type', sql.NVarChar, type)
      .input('created_by', sql.Int, created_by)
      .query('INSERT INTO Notices (title, content, type, created_by) VALUES (@title, @content, @type, @created_by)');
    res.json({ success: true, message: 'Notice/Event posted' });
  } catch (err) {
    console.error('Error posting notice:', err);
    res.status(500).json({ message: 'Failed to post notice/event', error: err.message });
  }
});

// GET: All notices/events (for both admin and member dashboards)
router.get('/notices', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, title, content, type, created_at FROM Notices ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notices/events' });
  }
});

//Change PhoneNumber
router.put('/change-phone', verifyToken, async (req, res) => {
  const { oldPhone, newPhone } = req.body;

  if (!oldPhone || !newPhone) {
    return res.status(400).json({ message: 'Both old and new phone numbers are required.' });
  }

  try {
    const pool = await poolPromise;

    // Check if old phone exists
    const oldResult = await pool.request()
      .input('oldPhone', sql.VarChar, oldPhone)
      .query('SELECT * FROM Members WHERE PhoneNumber = @oldPhone');

    if (oldResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Old phone number not found.' });
    }

    // Check if new phone already exists
    const newResult = await pool.request()
      .input('newPhone', sql.VarChar, newPhone)
      .query('SELECT * FROM Members WHERE PhoneNumber = @newPhone');

    if (newResult.recordset.length > 0) {
      return res.status(409).json({ message: 'New phone number already exists.' });
    }

    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update Members table
      await transaction.request()
        .input('oldPhone', sql.VarChar, oldPhone)
        .input('newPhone', sql.VarChar, newPhone)
        .query(`UPDATE Members SET PhoneNumber = @newPhone WHERE PhoneNumber = @oldPhone`);

      // Update memberledger table
      await transaction.request()
        .input('oldPhone', sql.VarChar, oldPhone)
        .input('newPhone', sql.VarChar, newPhone)
        .query(`UPDATE memberledger SET phoneno = @newPhone WHERE phoneno = @oldPhone`);

      await transaction.commit();
      res.status(200).json({ message: 'Phone number updated successfully in all records.' });
    } catch (err) {
      await transaction.rollback();
      console.error('Transaction error:', err);
      res.status(500).json({ message: 'Failed to update phone numbers.' });
    }

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});


module.exports = router;