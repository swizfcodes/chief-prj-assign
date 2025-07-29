const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET = 'your_jwt_secret';
const {  request } = require('../db-wrapper');

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

    req.adminId = decoded.id; //Attach to request
    next();
  });
};

// Create Admin (no password hashing)
router.post('/create', async (req, res) => {
  try {
    // Count existing admins
    const countResult = await request`SELECT COUNT(*) AS count FROM admins`.run();
    const adminCount = countResult.recordset[0].count;
    const created_at = new Date();

    // If admins exist, require JWT token
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

    // Check if admin email already exists
    const checkResult = await request`
      SELECT * FROM admins WHERE email = ${email}
    `.run();

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    // Insert new admin
    await request`
      INSERT INTO admins (fullname, email, password, role, created_at)
      VALUES (${fullname}, ${email}, ${password}, ${role}, ${created_at})
    `.run();

    res.status(201).json({ message: 'Admin created successfully' });

  } catch (err) {
    console.error('Create Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate admin
router.patch('/activate/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await request('UPDATE admins SET active = 1 WHERE id = @id')
      .inputs({id})
      .run();
    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin activated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate admin
router.patch('/deactivate/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await request('UPDATE admins SET active = 0 WHERE id = @id')
     .inputs({id})
     .run();
     
    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete admin
router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await request('DELETE FROM admins WHERE id = @id')
      .inputs({id})
      .run();
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

    const result = await request('SELECT * FROM admins WHERE email = @email')
      .inputs({ email })
      .run();

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = result.recordset[0];
    if (password !== admin.password) {
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


// Admin Forgot Password Route
router.post('/reset-adminpassword', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  try {
    const result = await request`
      UPDATE admins
      SET [Password] = ${newPassword}
      WHERE [Email] = ${email}
    `.run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  List admins
router.get('/list', verifyToken, async (req, res) => {
  try {
    
    const result = await request('SELECT Id, fullname, email, role, active FROM admins').run();
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

    await request('UPDATE admins SET fullname=@fullname, email=@email, role=@role WHERE id=@id')
      .inputs({ id, fullname, email, role })
      .run();

    res.json({ message: 'Admin updated successfully' });
  } catch (err) {
    console.error('Update Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard Data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const [ledger, summary, expenses, std] = await Promise.all([
      request('SELECT TOP (1000) phoneno, transdate, amount, remark FROM memberledger').run(),
      request('SELECT TOP (1000) period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary').run(),
      request('SELECT TOP (1000) docdate, project, remarks, amount FROM ocdaexpenses').run(),
      request('SELECT TOP (1000) expscode, expsdesc FROM Stdxpenses').run()
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


  // GET /admin/memberledgerfor reports
router.get('/memberledger', verifyToken, async (req, res) => {
  try {
    const result = await request(`
      SELECT 
        phoneno, 
        DATE_FORMAT(transdate, '%Y-%m-%d') AS transdate,
        amount, 
        remark, 
        DATE_FORMAT(paydate, '%Y-%m-%d') AS paydate
      FROM memberledger
      ORDER BY transdate DESC
    `).run();
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching member ledger:', err);
    res.status(500).json({ error: 'Failed to fetch member ledger' });
  }
});

  //for screen D
router.get('/member-recordledger', verifyToken, async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ message: 'Both "from" and "to" dates are required.' });
    }

    // Optional: Basic date validation
    // Date.parse handles various valid date string formats (e.g., YYYY-MM-DD, ISO 8601)
    if (isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
        return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    try {
        const result = await request(`
            SELECT 
                phoneno, 
                transdate, 
                amount, 
                remark, 
                paydate 
            FROM memberledger
            WHERE 
                paydate >= @from 
                AND paydate < DATE_ADD(@to, INTERVAL 1 DAY)
            ORDER BY paydate DESC
        `)
        .inputs({ from, to }) 
        .run();

        res.json(result.recordset);
    } catch (err) {
        console.error('Member Ledger fetch error:', err);
        res.status(500).json({ message: 'Server error: Failed to retrieve ledger records.' });
    }
});

  // GET /admin/monthlysummary
router.get('/monthlysummary', verifyToken, async (req, res) => {
  try {
    const result = await request('SELECT period, openbalance, Debitbalance, Creditbalance, Netbalance FROM monthlysummary').run();
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching monthly summary:', err);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
});

  // GET /admin/ocdaexpenses
router.get('/ocdaexpenses', verifyToken, async (req, res) => {
  try {
    const result = await request('SELECT docdate, project, remarks, voucher, amount FROM ocdaexpenses').run();
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching OCDA expenses:', err);
    res.status(500).json({ error: 'Failed to fetch OCDA expenses' });
  }
});

// GET /admin/stdxpenses
router.get('/stdxpenses', verifyToken, async (req, res) => {
  try {
    const result = await request('SELECT expscode, expsdesc FROM stdxpenses').run();
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching standard expenses:', err);
    res.status(500).json({ error: 'Failed to fetch standard expenses' });
  }
});

// GET /admin/incomeclassifications
router.get('/incomeclass', verifyToken, async (req, res) => {
  try {
    const result = await request('SELECT incomecode, incomedesc FROM incomeclassification').run();
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching income classifications:', err);
    res.status(500).json({ error: 'Failed to fetch income classifications' });
  }
});


// create new member
router.post('/createmember', verifyToken, async (req, res) => {
    try {
        const {
            PhoneNumber, phoneno2, Surname, othernames, Title, HonTitle, Sex,
            Quarters, Ward, State, Town, DOB, Qualifications, Profession,
            exitdate, Password, email
        } = req.body;

        // Helper function to convert empty strings to null
        const clean = val => (val?.trim() === '' ? null : val);

        // Prepare the inputs object with cleaned values
        const memberInputs = {
            PhoneNumber: clean(PhoneNumber), 
            phoneno2: clean(phoneno2),
            email: clean(email),
            Password: clean(Password), 
            Surname: clean(Surname),
            othernames: clean(othernames),
            Title: clean(Title),
            HonTitle: clean(HonTitle),
            Sex: clean(Sex),
            Quarters: clean(Quarters),
            Ward: clean(Ward),
            State: clean(State),
            Town: clean(Town),
            DOB: DOB, 
            Qualifications: clean(Qualifications),
            Profession: clean(Profession),
            exitdate: exitdate || '', 
            CreatedAt: new Date(), 
            createdby: req.adminId 
        };

        await request(`
            INSERT INTO members (
                PhoneNumber, phoneno2, Surname, othernames, Title, HonTitle, Sex,
                Quarters, Ward, State, Town, DOB, Qualifications, Profession,
                exitdate, Password, CreatedAt, email, createdby
            ) VALUES (
                @PhoneNumber, @phoneno2, @Surname, @othernames, @Title, @HonTitle, @Sex,
                @Quarters, @Ward, @State, @Town, @DOB, @Qualifications, @Profession,
                @exitdate, @Password, @CreatedAt, @email, @createdby
            )
        `)
        .inputs(memberInputs) // Pass the entire inputs object
        .run();

        res.status(201).json({ message: 'Member created successfully' });

    } catch (err) {
        console.error('Create Member Error:', err);
        // Check for specific error types if needed (e.g., duplicate key error)
        if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) { // Example for MySQL duplicate entry error
            return res.status(409).json({ message: 'A member with this phone number already exists.' });
        }
        res.status(500).json({ message: 'Server error: Failed to create member.' });
    }
});

// Gemerate Monthly Summary
router.post('/generate-summary', verifyToken, async (req, res) => {
  try {
    const { year, month } = req.body;
    const paddedMonth = month.padStart(2, '0');
    const period = `${year}${paddedMonth}`; // e.g., 202406

    // Get today's date
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    let lastMonth = thisMonth - 1;
    let lastMonthYear = thisYear;

    if (lastMonth === 0) {
      lastMonth = 12;
      lastMonthYear--;
    }

    const lastPeriod = `${lastMonthYear}${String(lastMonth).padStart(2, '0')}`;

    // Only allow summaries for past months
    if (parseInt(period) > parseInt(lastPeriod)) {
      return res.status(400).json({ message: 'You can only generate summary for the previous or earlier months.' });
    }

    // Check if summary already exists
    const exists = await request('SELECT 1 FROM monthlysummary WHERE period = @period')
      .inputs({ period })
      .run();

    if (exists.recordset.length > 0) {
      return res.status(409).json({ message: `Summary for ${period} already exists.` });
    }

    // 💳 Total Credit (inflows)
    const creditResult = await request(`
      SELECT IFNULL(SUM(amount), 0) AS totalCredit
      FROM memberledger
      WHERE DATE_FORMAT(transdate, '%Y%m') = @period
    `).inputs({ period }).run();

    const totalCredit = creditResult.recordset[0].totalCredit;

    // 💸 Total Debit (expenses)
    const debitResult = await request(`
      SELECT IFNULL(SUM(amount), 0) AS totalDebit
      FROM ocdaexpenses
      WHERE DATE_FORMAT(docdate, '%Y%m') = @period
    `).inputs({ period }).run();

    const totalDebit = debitResult.recordset[0].totalDebit;

    // 🧾 Get previous balance
    const prev = await request(`
      SELECT Netbalance AS prevNet
      FROM monthlysummary
      WHERE period < @period
      ORDER BY period DESC
      LIMIT 1
    `).inputs({ period }).run();

    const prevNet = prev.recordset.length > 0 ? prev.recordset[0].prevNet : 0;

    const Netbalance = prevNet + totalCredit - totalDebit;

    // 💾 Save new summary
    await request(`
      INSERT INTO monthlysummary (period, openbalance, Debitbalance, Creditbalance, Netbalance)
      VALUES (@period, @openbalance, @Debitbalance, @Creditbalance, @Netbalance)
    `).inputs({
      period,
      openbalance: prevNet,
      Debitbalance: totalCredit, // Your original code swapped these
      Creditbalance: totalDebit,
      Netbalance
    }).run();

    // ✅ Fetch & return inserted summary
    const summaryResult = await request(`
      SELECT period, openbalance, Debitbalance, Creditbalance, Netbalance
      FROM monthlysummary
      WHERE period = @period
    `).inputs({ period }).run();

    res.status(201).json({
      message: 'Monthly summary saved',
      summary: summaryResult.recordset[0]
    });

  } catch (err) {
    console.error('Monthly Summary Error:', err);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

//show list of members
router.get('/members', verifyToken, async (req, res) => {
  try {
    
    const result = await request(`
        SELECT 
          PhoneNumber, Surname, othernames, Title, Sex, Quarters, Ward, 
          State, Town, DOB, Profession, Qualifications, email
        FROM members
        ORDER BY surname
      `).run();
    res.json(result.recordset);
  } catch (err) {
    console.error('Fetch members Error:', err);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});


// Delete members
router.delete('/member/:phone', verifyToken, async (req, res) => {
  try {
    const PhoneNumber = req.params.phone;

    const result = await request('DELETE FROM members WHERE PhoneNumber = @PhoneNumber')
      .inputs({ PhoneNumber })
      .run();

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
    const PhoneNumber = req.params.phone;
    const result = await request('SELECT * FROM members WHERE PhoneNumber = @PhoneNumber')
      .inputs({PhoneNumber})
      .run();

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
        const { phone: oldPhoneNumber } = req.params; // Get phone from URL parameter

        // 1. Get the existing member
        // Corrected usage: .run() is a method, not a property
        const existingResult = await request('SELECT * FROM members WHERE PhoneNumber = @oldPhoneNumber')
            .inputs({ oldPhoneNumber })
            .run();

        if (existingResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Member not found.' });
        }
        const existingMember = existingResult.recordset[0];

        // 2. Define fields to be updated and merge data
        const fieldsToUpdate = [
            'PhoneNumber', 'phoneno2', 'Surname', 'othernames', 'Title', 'HonTitle', 'Sex',
            'Quarters', 'Ward', 'State', 'Town', 'DOB', 'Qualifications',
            'Profession', 'exitdate', 'Password', 'email'
        ];

        const updatedInputs = {};

        fieldsToUpdate.forEach(field => {
            // Check if the field is present in req.body
            if (req.body[field] !== undefined) {
                // If it's a date field and the value is an empty string, set to null
                if ((field === 'DOB' || field === 'exitdate') && req.body[field] === '') {
                    updatedInputs[field] = null;
                } else {
                    // Otherwise, use the value from req.body
                    updatedInputs[field] = req.body[field];
                }
            } else {
                // If not in req.body, retain the existing value from the database
                updatedInputs[field] = existingMember[field];
            }
        });

        // Ensure the PhoneNumber for the WHERE clause is correctly set
        // If PhoneNumber is being updated, use the new one for the UPDATE statement's SET clause,
        // but always use oldPhoneNumber for the WHERE clause.
        updatedInputs.oldPhoneNumber = oldPhoneNumber; // Parameter for the WHERE clause

        // 3. Construct the UPDATE query
        const setClauses = fieldsToUpdate.map(field => `${field}=@${field}`).join(', ');

        const updateQuery = `
            UPDATE members SET
                ${setClauses}
            WHERE PhoneNumber = @oldPhoneNumber
        `;

        // 4. Execute the update
        await request(updateQuery)
            .inputs(updatedInputs) // Pass the merged inputs
            .run();

        res.json({ message: 'Member updated successfully.' });

    } catch (err) {
        console.error('Update member error:', err);
        res.status(500).json({ message: 'Failed to update member.' });
    }
});


// POST: Add Ledger Entry
router.post('/ledger-entry/:phoneno', verifyToken, async (req, res) => {
  const { phoneno } = req.params;
  const { transdate, amount, remark } = req.body;
  
  try {
    // First, check if the phone number exists in the members table
    const memberCheck = await request(`SELECT PhoneNumber FROM members WHERE PhoneNumber = @phoneno`)
      .inputs({phoneno})
      .run();
    
    // If no member found with this phone number
    if (memberCheck.recordset.length === 0) {
      return res.status(400).json({ 
        field: 'phoneno',
        message: 'Member does not exist'
      });
    }
    
    // If member exists, proceed with ledger entry
    await request(`INSERT INTO memberledger(phoneno, transdate, amount, remark, paydate, created_by)
      VALUES (@phoneno, @transdate, @amount, @remark, CURRENT_DATE, @created_by)`)
      .inputs({phoneno, transdate, amount, remark, created_by: req.adminId})
      .run();
      
    res.status(200).json({ message: 'Ledger entry recorded successfully' });
    
  } catch (err) {
    console.error('Ledger operation error:', err);
    res.status(500).json({ message: 'Failed to record ledger entry' });
  }
});

// GET: Ledger Entries
router.get('/api/ledger-entry/:phoneno', verifyToken, async (req, res) => {
  const { phoneno } = req.params;
  try {
    const result = await request(`SELECT 
              amount, 
              FORMAT(transdate, 'yyyy-MM-dd') AS transdate,
              amount, 
              remark, 
              FORMAT(paydate, 'yyyy-MM-dd') AS paydate
            FROM memberledger
            WHERE phoneno = @phoneno 
            ORDER BY transdate DESC`)
    .inputs({phoneno})
    .run();
    res.send(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Could not fetch ledger entries' });
  }
});

// Add Expense 
router.post('/ocdaexpenses', verifyToken, async (req, res) => {
  try {
    const { docdate, project, amount, remarks, voucher } = req.body;

    if (!docdate || !project || amount == null || !remarks) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await request(`
      INSERT INTO ocdaexpenses (docdate, project, remarks, amount, voucher, created_by)
      VALUES (@docdate, @project, @remarks, @amount, @voucher, @created_by)
    `)
    .inputs({ docdate, project, remarks, amount, voucher, created_by: req.adminId })
    .run();

    res.status(201).json({
      success: true,
      message: 'OCDA expense recorded successfully',
      rowsAffected: result.rowsAffected[0]
    });
  } catch (err) {
    console.error('OCDA Expense Error:', err);
    res.status(500).json({ error: 'Failed to save OCDA expense' });
  }
});


// GET: Populate dropdowns
router.get('/enquiry/options', verifyToken, async (req, res) => {
    try {
        // Use the 'request' from your db-wrapper
        const [membersResult, wardsResult, quartersResult] = await Promise.all([
            request("SELECT PhoneNumber, CONCAT(Surname, ' ', othernames) AS fullname FROM members").run(),
            request("SELECT DISTINCT Ward FROM members WHERE Ward IS NOT NULL AND Ward <> ''").run(),
            request("SELECT DISTINCT Quarters FROM members WHERE Quarters IS NOT NULL AND Quarters <> ''").run()
        ]);

        res.json({
            members: membersResult.recordset,
            wards: wardsResult.recordset.map(w => w.Ward),
            quarters: quartersResult.recordset.map(q => q.Quarters)
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

/**
 * Helper function to build date filter clauses and add parameters to inputs.
 * @param {string} dateColumn The name of the date column (e.g., 'transdate', 'docdate').
 * @param {string} start The start date string.
 * @param {string} end The end date string.
 * @param {object} inputs The object to collect query parameters.
 * @returns {string} The SQL date filter clause (e.g., " AND column >= @start_column AND column <= @end_column").
 */


function buildDateFilter(dateColumn, start, end, inputs) {
    let clauses = [];
    const paramNamePrefix = dateColumn.replace('.', '_'); // e.g., 'transdate' or 'l_transdate'

    if (start) {
        clauses.push(`${dateColumn} >= @start_${paramNamePrefix}`);
        inputs[`start_${paramNamePrefix}`] = start;
    }
    if (end) {
        clauses.push(`${dateColumn} <= @end_${paramNamePrefix}`);
        inputs[`end_${paramNamePrefix}`] = end;
    }
    return clauses.length ? ` AND ${clauses.join(' AND ')}` : '';
}

// Main Enquiry Endpoint 
router.get('/enquiry', verifyToken, async (req, res) => {
    const { type, param = 'ALL', mode = 'summary', start, end } = req.query;

    let summary = [];
    let detail = [];
    let inputs = {}; // Initialize inputs object for query parameters

    try {
        // MEMBER
        if (type === 'member') {
            const dateFilter = buildDateFilter('l.transdate', start, end, inputs); // Pass inputs object

            if (param === 'ALL') {
                // List all members with total transactions
                const summaryQuery = `
                    SELECT 
                        m.PhoneNumber, 
                        CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                        COALESCE(SUM(l.amount), 0) AS total
                    FROM members m
                    LEFT JOIN memberledger l ON m.PhoneNumber = l.phoneno ${dateFilter}
                    GROUP BY m.PhoneNumber, m.Surname, m.othernames
                    ORDER BY fullname
                `;
                summary = (await request(summaryQuery).inputs(inputs).run()).recordset;

                // Sum for ALL
                const allTotal = summary.reduce((sum, row) => sum + Number(row.total), 0);
                summary.push({ PhoneNumber: 'ALL', fullname: 'ALL', total: allTotal });

                if (mode === 'detail') {
                    // All member transactions (for right side)
                    const detailQuery = `
                        SELECT 
                            l.phoneno, 
                            CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                            DATE_FORMAT(l.transdate, '%Y-%m-%d') AS transdate, 
                            l.amount, 
                            l.remark
                        FROM memberledger l
                        LEFT JOIN members m ON l.phoneno = m.PhoneNumber
                        WHERE 1=1 ${dateFilter}
                        ORDER BY l.phoneno, l.transdate DESC
                    `;
                    detail = (await request(detailQuery).inputs(inputs).run()).recordset;
                }
            } else {
                // Single member
                const filterClause = `l.phoneno = @param`;
                inputs.param = param; // Add param to inputs

                const whereClause = `WHERE ${filterClause}${dateFilter}`;

                if (mode === 'summary') {
                    const summaryQuery = `
                        SELECT 
                            l.phoneno, 
                            CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                            SUM(l.amount) AS total
                        FROM memberledger l
                        LEFT JOIN members m ON l.phoneno = m.PhoneNumber
                        ${whereClause}
                        GROUP BY l.phoneno, m.Surname, m.othernames
                    `;
                    summary = (await request(summaryQuery).inputs(inputs).run()).recordset;
                } else { // mode === 'detail'
                    const detailQuery = `
                        SELECT 
                            l.phoneno, 
                            CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                            DATE_FORMAT(l.transdate, '%Y-%m-%d') AS transdate, 
                            l.amount, 
                            l.remark
                        FROM memberledger l
                        LEFT JOIN members m ON l.phoneno = m.PhoneNumber
                        ${whereClause}
                        ORDER BY l.transdate DESC
                    `;
                    detail = (await request(detailQuery).inputs(inputs).run()).recordset;
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
            inputs = {}; // Reset inputs for new type
            const dateFilter = buildDateFilter('l.transdate', start, end, inputs);

            if (param === 'ALL') {
                // List all wards with total transactions
                const summaryQuery = `
                    SELECT 
                        m.Ward, 
                        COALESCE(SUM(l.amount), 0) AS total
                    FROM members m
                    LEFT JOIN memberledger l ON m.PhoneNumber = l.phoneno ${dateFilter}
                    WHERE m.Ward IS NOT NULL AND m.Ward <> ''
                    GROUP BY m.Ward
                    ORDER BY m.Ward
                `;
                summary = (await request(summaryQuery).inputs(inputs).run()).recordset;

                // Sum for ALL
                const allTotal = summary.reduce((sum, row) => sum + Number(row.total), 0);
                summary.push({ Ward: 'ALL', total: allTotal });

                if (mode === 'detail') {
                    // For each ward, list member transactions
                    const wards = summary.filter(w => w.Ward !== 'ALL').map(w => w.Ward);
                    for (const ward of wards) {
                        // Create new inputs object for each iteration to avoid parameter clashes
                        const iterationInputs = { ...inputs, ward: ward }; 
                        const membersQuery = `
                            SELECT 
                                l.phoneno, 
                                CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                                DATE_FORMAT(l.transdate, '%Y-%m-%d') AS transdate, 
                                l.amount, 
                                l.remark
                            FROM memberledger l
                            LEFT JOIN members m ON l.phoneno = m.PhoneNumber
                            WHERE m.Ward = @ward ${dateFilter}
                            ORDER BY l.phoneno, l.transdate DESC
                        `;
                        const members = (await request(membersQuery).inputs(iterationInputs).run()).recordset;
                        if (ward && members && members.length > 0) {
                            detail.push({ ward, members });
                        }
                    }
                }
            } else {
                // Single ward
                inputs.param = param; // Add param to inputs

                const memberListQuery = `SELECT PhoneNumber FROM members WHERE Ward = @param`;
                const memberList = await request(memberListQuery).inputs(inputs).run();
                const phones = memberList.recordset.map(m => `'${m.PhoneNumber}'`); // Keep single quotes for IN clause
                
                const phoneFilter = phones.length ? `l.phoneno IN (${phones.join(',')})` : '1=0';
                const transFilter = `WHERE ${phoneFilter}${dateFilter}`; // dateFilter already starts with AND if present

                const summaryQuery = `
                    SELECT 
                        @param AS Ward, 
                        SUM(l.amount) AS total
                    FROM memberledger l
                    ${transFilter}
                `;
                summary = (await request(summaryQuery).inputs(inputs).run()).recordset;

                if (mode === 'detail') {
                    const membersQuery = `
                        SELECT 
                            l.phoneno, 
                            CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                            DATE_FORMAT(l.transdate, '%Y-%m-%d') AS transdate, 
                            l.amount, 
                            l.remark
                        FROM memberledger l
                        LEFT JOIN members m ON l.phoneno = m.PhoneNumber
                        ${transFilter}
                        ORDER BY l.phoneno, l.transdate DESC
                    `;
                    const members = (await request(membersQuery).inputs(inputs).run()).recordset;
                    detail = [{ ward: param, members }];
                }
            }
        }

        // QUARTER
        else if (type === 'quarter') {
            inputs = {}; // Reset inputs for new type
            const dateFilter = buildDateFilter('l.transdate', start, end, inputs);

            if (param === 'ALL') {
                // List all quarters with total transactions
                const summaryQuery = `
                    SELECT 
                        m.Quarters, 
                        COALESCE(SUM(l.amount), 0) AS total
                    FROM members m
                    LEFT JOIN memberledger l ON m.PhoneNumber = l.phoneno ${dateFilter}
                    WHERE m.Quarters IS NOT NULL AND m.Quarters <> ''
                    GROUP BY m.Quarters
                    ORDER BY m.Quarters
                `;
                summary = (await request(summaryQuery).inputs(inputs).run()).recordset;

                // Sum for ALL
                const allTotal = summary.reduce((sum, row) => sum + Number(row.total), 0);
                summary.push({ Quarters: 'ALL', total: allTotal });

                if (mode === 'detail') {
                    // For each quarter, list wards and under each ward, list member transactions
                    const quarters = summary.filter(q => q.Quarters !== 'ALL').map(q => q.Quarters);
                    for (const quarter of quarters) {
                        const iterationInputs = { ...inputs, quarter: quarter }; // Create new inputs for iteration
                        // Get wards in this quarter
                        const wardsQuery = `SELECT DISTINCT Ward FROM members WHERE Quarters = @quarter`;
                        const wardsResult = await request(wardsQuery).inputs(iterationInputs).run();
                        const wards = wardsResult.recordset.map(w => w.Ward);

                        const wardsData = [];
                        for (const ward of wards) {
                            const nestedIterationInputs = { ...iterationInputs, ward: ward }; // Create new inputs for nested iteration
                            const membersQuery = `
                                SELECT 
                                    l.phoneno, 
                                    CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                                    DATE_FORMAT(l.transdate, '%Y-%m-%d') AS transdate, 
                                    l.amount, 
                                    l.remark
                                FROM memberledger l
                                LEFT JOIN members m ON l.phoneno = m.PhoneNumber
                                WHERE m.Ward = @ward AND m.Quarters = @quarter ${dateFilter}
                                ORDER BY l.phoneno, l.transdate DESC
                            `;
                            const members = (await request(membersQuery).inputs(nestedIterationInputs).run()).recordset;
                            wardsData.push({ ward, members });
                        }
                        detail.push({ quarter, wards: wardsData });
                    }
                }
            } else {
                // Single quarter
                inputs.param = param; // Add param to inputs

                const wardsQuery = `SELECT DISTINCT Ward FROM members WHERE Quarters = @param`;
                const wardsResult = await request(wardsQuery).inputs(inputs).run();
                const wards = wardsResult.recordset.map(w => w.Ward);

                const phonesQuery = `SELECT PhoneNumber, Ward FROM members WHERE Quarters = @param`;
                const phonesResult = await request(phonesQuery).inputs(inputs).run();
                const phonesByWard = phonesResult.recordset.reduce((acc, row) => {
                    acc[row.Ward] = acc[row.Ward] || [];
                    acc[row.Ward].push(`'${row.PhoneNumber}'`);
                    return acc;
                }, {});

                const allPhones = Object.values(phonesByWard).flat().join(',');
                const phoneFilter = allPhones.length ? `phoneno IN (${allPhones})` : '1=0';

                const summaryQuery = `
                    SELECT 
                        @param AS Quarter, 
                        SUM(amount) AS total
                    FROM memberledger
                    WHERE ${phoneFilter}${dateFilter}
                `;
                summary = (await request(summaryQuery).inputs(inputs).run()).recordset;

                if (mode === 'detail') {
                    const wardsData = [];
                    for (const ward of wards) {
                        const phones = phonesByWard[ward] || [];
                        if (phones.length === 0) continue;

                        // Get all transactions for this ward
                        const membersQuery = `
                            SELECT 
                                l.phoneno, 
                                CONCAT(m.Surname, ' ', m.othernames) AS fullname, 
                                DATE_FORMAT(l.transdate, '%Y-%m-%d') AS transdate, 
                                l.amount, 
                                l.remark
                            FROM memberledger l
                            LEFT JOIN members m ON l.phoneno = m.PhoneNumber
                            WHERE l.phoneno IN (${phones.join(',')})${dateFilter}
                            ORDER BY l.phoneno, l.transdate DESC
                        `;
                        // Note: no specific @param for this query, as phones are directly inserted
                        // but buildDateFilter adds its own date params.
                        const nestedInputs = { ...inputs }; // Clone for nested scope
                        const members = (await request(membersQuery).inputs(nestedInputs).run()).recordset;
                        wardsData.push({ ward, members });
                    }
                    detail = [{ quarter: param, wards: wardsData }];
                }
            }
        }

        // ACCOUNT
        else if (type === 'account') {
            inputs = {}; // Reset inputs for new type
            // Note: Using `buildDateFilter` here with distinct parameter names for subqueries
            const creditFilter = buildDateFilter('memberledger.transdate', start, end, inputs);
            const debitFilter = buildDateFilter('ocdaexpenses.docdate', start, end, inputs);

            // Pass start/end directly for selection as well, if needed for display
            inputs.StartDate = start || null; // Use null for non-existent dates instead of 'N/A' in SQL inputs
            inputs.EndDate = end || null;

            const accountQuery = `
                SELECT
                    @StartDate AS StartDate,
                    @EndDate AS EndDate,
                    (SELECT COALESCE(SUM(amount), 0) FROM memberledger WHERE 1=1 ${creditFilter}) AS TotalCredit,
                    (SELECT COALESCE(SUM(amount), 0) FROM ocdaexpenses WHERE 1=1 ${debitFilter}) AS TotalDebit
            `;
            summary = (await request(accountQuery).inputs(inputs).run()).recordset;
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
  
  // Predefined safe configuration
  const tableMap = {
    titles: { table: 'title', columns: ['title'] },
    qualifications: { table: 'qualfication', columns: ['qualification'] },
    wards: { table: 'oyinwards', columns: ['ward', 'Quarter'] },
    hontitles: { table: 'hontitle', columns: ['Htitle', 'titlerank'] },
    states: { table: 'state', columns: ['statename', 'statecode'] }
  };
  
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });
  
  // Build the query string directly (since table/column names can't be parameterized)
  const safeCols = config.columns.map(col => `\`${col}\``).join(', ');
  const safeTable = `\`${config.table}\``;
  const query = `SELECT ${safeCols} FROM ${safeTable}`;
  
  try {
    // Using your custom request wrapper
    const result = await request(query).run();
    res.json(result.recordset); // Your wrapper returns { recordset, rowsAffected }
  } catch (err) {
    console.error(`Error fetching ${type}:`, err);
    res.status(500).json({ error: `Failed to fetch ${type}` });
  }
});

router.get('/static/states', async (req, res) => {
  try {
    
    const result = await request
      `SELECT statename, statecode FROM state`.run();
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching states:', err);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});


// --- POST (Add) ---
const tableMap = {
  titles: {
    table: 'title',
    columns: ['title']
  },
  qualifications: {
    table: 'Qualfication',
    columns: ['qualification']
  },
  wards: {
    table: 'oyinwards',
    columns: ['ward', 'Quarter']
  },
  hontitles: {
    table: 'HonTitle',
    columns: ['Htitle', 'titlerank']
  }
};

router.post('/static/:type', async (req, res) => {
  const { type } = req.params;
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });

  try {
    const values = config.columns.map(col => req.body[col]);
    if (values.some(val => val === undefined || val === null)) {
      return res.status(400).json({ error: 'Missing required fields', required: config.columns });
    }

    const inputParams = {};
    config.columns.forEach((col, i) => inputParams[`val${i}`] = values[i]);

    const query = `
      INSERT INTO ${config.table} (${config.columns.join(', ')})
      VALUES (${config.columns.map((_, i) => `@val${i}`).join(', ')})
    `;

    const result = await request(query).inputs(inputParams).run();
    res.json({ success: true, message: `Inserted into ${type}`, rowsAffected: result.rowsAffected[0] });

  } catch (err) {
    console.error(`Insert error (${type}):`, err);
    res.status(500).json({ error: `Failed to insert into ${type}`, details: err.message });
  }
});

// --- PUT ---
router.put('/static/:type', async (req, res) => {
  const { type } = req.params;
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });

  try {
    const inputParams = {};
    let whereClause = '';

    if (type === 'wards') {
      const { ward, Quarter } = req.query;
      if (!ward || !Quarter) return res.status(400).json({ error: 'ward and Quarter required' });
      whereClause = 'WHERE ward = @ward AND Quarter = @Quarter';
      inputParams.ward = ward;
      inputParams.Quarter = Quarter;

    } else if (type === 'hontitles') {
      const { Htitle, titlerank } = req.query;
      if (!Htitle || !titlerank) return res.status(400).json({ error: 'Htitle and titlerank required' });
      whereClause = 'WHERE Htitle = @Htitle AND titlerank = @titlerank';
      inputParams.Htitle = Htitle;
      inputParams.titlerank = titlerank;

    } else {
      const { value } = req.query;
      if (!value) return res.status(400).json({ error: 'value required for update' });
      whereClause = `WHERE ${config.columns[0]} = @value`;
      inputParams.value = value;
    }

    config.columns.forEach(col => {
      if (req.body[col] === undefined) throw new Error(`Missing new value for ${col}`);
      inputParams[`new_${col}`] = req.body[col];
    });

    const setClause = config.columns.map(col => `${col} = @new_${col}`).join(', ');
    const query = `UPDATE ${config.table} SET ${setClause} ${whereClause}`;
    const result = await request(query).inputs(inputParams).run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'No record found to update' });
    }

    res.json({ success: true, message: `Updated ${type}`, rowsAffected: result.rowsAffected[0] });

  } catch (err) {
    console.error(`Update error (${type}):`, err);
    res.status(500).json({ error: `Failed to update ${type}`, details: err.message });
  }
});

// --- DELETE ---
router.delete('/static/:type', async (req, res) => {
  const { type } = req.params;
  const config = tableMap[type];
  if (!config) return res.status(400).json({ error: 'Invalid type' });

  try {
    const inputParams = {};
    let whereClause = '';

    if (type === 'wards') {
      const { ward, Quarter } = req.query;
      if (!ward || !Quarter) return res.status(400).json({ error: 'ward and Quarter required' });
      whereClause = 'WHERE ward = @ward AND Quarter = @Quarter';
      inputParams.ward = ward;
      inputParams.Quarter = Quarter;

    } else if (type === 'hontitles') {
      const { Htitle, titlerank } = req.query;
      if (!Htitle || !titlerank) return res.status(400).json({ error: 'Htitle and titlerank required' });
      whereClause = 'WHERE Htitle = @Htitle AND titlerank = @titlerank';
      inputParams.Htitle = Htitle;
      inputParams.titlerank = titlerank;

    } else {
      const { value } = req.query;
      if (!value) return res.status(400).json({ error: 'value required for deletion' });
      whereClause = `WHERE ${config.columns[0]} = @value`;
      inputParams.value = value;
    }

    const query = `DELETE FROM ${config.table} ${whereClause}`;
    const result = await request(query).inputs(inputParams).run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'No record found to delete' });
    }

    res.json({ success: true, message: `Deleted from ${type}`, rowsAffected: result.rowsAffected[0] });

  } catch (err) {
    console.error(`Delete error (${type}):`, err);
    res.status(500).json({ error: `Failed to delete from ${type}`, details: err.message });
  }
});


//Standard Expenses
// GET all
router.get('/stdxpenses', async (req, res) => {
  try {
    const result = await request` expscode, expsdesc FROM stdxpenses`.run();
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// POST
router.post('/stdxpenses', async (req, res) => {
  const { expscode, expsdesc } = req.body;

  if (!expscode || !expsdesc) {
    return res.status(400).json({ error: 'Both expscode and expsdesc are required' });
  }

  try {
    const result = await request(`
      INSERT INTO stdxpenses (expscode, expsdesc)
      VALUES (@expscode, @expsdesc)
    `)
      .inputs({ expscode, expsdesc })
      .run();

    res.json({ success: true, rowsAffected: result.rowsAffected[0] });
  } catch (err) {
    console.error('Insert StdExpense Error:', err);
    res.status(500).json({ error: 'Failed to insert stdxpense', details: err.message });
  }
});

// PUT
router.put('/stdxpenses', async (req, res) => {
  const { expscode } = req.query;
  const { expsdesc } = req.body;

  if (!expscode || !expsdesc) {
    return res.status(400).json({ error: 'expscode (query) and expsdesc (body) are required' });
  }

  try {
    const result = await request(`
      UPDATE stdxpenses
      SET expsdesc = @expsdesc
      WHERE expscode = @expscode
    `)
      .inputs({ expscode, expsdesc })
      .run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Expense code not found' });
    }

    res.json({ success: true, rowsAffected: result.rowsAffected[0] });
  } catch (err) {
    console.error('Update StdExpense Error:', err);
    res.status(500).json({ error: 'Failed to update stdxpense', details: err.message });
  }
});

// DELETE
router.delete('/stdxpenses', async (req, res) => {
  const { expscode } = req.query;

  if (!expscode) {
    return res.status(400).json({ error: 'expscode is required' });
  }

  try {
    const result = await request(`
      DELETE FROM stdxpenses
      WHERE expscode = @expscode
    `)
      .inputs({ expscode })
      .run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Expense code not found' });
    }

    res.json({ success: true, rowsAffected: result.rowsAffected[0] });
  } catch (err) {
    console.error('Delete StdExpense Error:', err);
    res.status(500).json({ error: 'Failed to delete stdxpense', details: err.message });
  }
});

// POST income class
router.post('/incomeclass', async (req, res) => {
  const { incomecode, incomedesc } = req.body;

  if (!incomecode || !incomedesc) {
    return res.status(400).json({ error: 'Both incomecode and incomedesc are required.' });
  }

  try {
    await request(`
      INSERT INTO incomeclassification (incomecode, incomedesc)
      VALUES (@incomecode, @incomedesc)
    `)
    .inputs({ incomecode, incomedesc })
    .run();

    res.json({ success: true, message: 'Income classification added.' });

  } catch (err) {
    console.error('Insert Error:', err);
    res.status(500).json({ error: 'Insert failed', details: err.message });
  }
});

// PUT
router.put('/incomeclass', async (req, res) => {
  const { incomecode } = req.query;
  const { incomedesc } = req.body;

  if (!incomecode || !incomedesc) {
    return res.status(400).json({ error: 'incomecode and incomedesc are required.' });
  }

  try {
    const result = await request(`
      UPDATE incomeclassification
      SET incomedesc = @incomedesc
      WHERE incomecode = @incomecode
    `)
    .inputs({ incomecode, incomedesc })
    .run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Income classification not found.' });
    }

    res.json({ success: true, message: 'Income classification updated.' });

  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

// DELETE
router.delete('/incomeclass', async (req, res) => {
  const { incomecode } = req.query;

  if (!incomecode) {
    return res.status(400).json({ error: 'incomecode is required.' });
  }

  try {
    const result = await request(`
      DELETE FROM incomeclassification
      WHERE incomecode = @incomecode
    `)
    .inputs({ incomecode })
    .run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Income classification not found.' });
    }

    res.json({ success: true, message: 'Income classification deleted.' });

  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

// ===== OCDA Expenses Analysis
router.get('/ocda-expenses-analysis', verifyToken, async (req, res) => {
  try {
    const { start, end, code = 'ALL', mode = 'summary' } = req.query;

    const where = [];
    const params = {};

    if (start) {
      where.push(`docdate >= @start`);
      params.start = start;
    }
    if (end) {
      where.push(`docdate <= @end`);
      params.end = end;
    }
    if (code !== 'ALL') {
      where.push(`e.project = @code`);
      params.code = code;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const query = mode === 'summary'
      ? `
        SELECT 
          e.project AS code, 
          s.expsdesc AS description, 
          SUM(e.amount) AS amount
        FROM ocdaexpenses e
        LEFT JOIN stdxpenses s ON e.project = s.expscode
        ${whereClause}
        GROUP BY e.project, s.expsdesc
        ORDER BY e.project`
      : `
        SELECT 
          e.project AS code,
          s.expsdesc AS description,
          DATE_FORMAT(e.docdate, '%Y-%m-%d') AS date, 
          e.remarks AS remark, 
          e.amount
        FROM ocdaexpenses e
        LEFT JOIN stdxpenses s ON e.project = s.expscode
        ${whereClause}
        ORDER BY e.project, e.docdate`;

    const result = await request(query).inputs(params).run();
    res.json(result.recordset);

  } catch (err) {
    console.error('OCDA Expenses Analysis error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ===== OCDA Income Analysis
router.get('/ocda-income-analysis', verifyToken, async (req, res) => {
  try {
    const { start, end, code = 'ALL', mode = 'summary' } = req.query;
    const whereConditions = [];
    const params = {}; 

    console.log('--- Debugging Parameter Issues (Admin.js) ---');
    console.log('1. Original code from req.query:', code);

    let decodedCode = code;
    if (code !== 'ALL') {
        try {
            decodedCode = decodeURIComponent(code); 
        } catch (e) {
            console.warn("Failed to decode 'code' parameter:", code, e);
            decodedCode = code;
        }
    }
    console.log('2. Decoded code (before adding wildcards):', decodedCode); 

    if (start) {
      whereConditions.push(`ml.transdate >= @start`);
      params.start = start;
    }
    if (end) {
      whereConditions.push(`ml.transdate <= @end`); 
      params.end = end;
    }
    if (decodedCode !== 'ALL') {
      whereConditions.push(`ml.remark LIKE @code`);
      params.code = `%${decodedCode}%`; 
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    console.log('3. Final params object sent to db-wrapper:', params); 
    console.log('--- End Debugging Parameter Issues (Admin.js) ---');

    let result;

    if (mode === 'summary') {
      const query = `
        SELECT
          IFNULL(ic.incomecode, 'No Code') AS code,
          ml.remark AS description,
          SUM(ml.amount) AS amount,
          COUNT(*) AS transaction_count
        FROM memberledger ml
        LEFT JOIN incomeclassification ic ON ml.remark = ic.incomedesc
        ${whereClause}
        GROUP BY ml.remark, ic.incomecode
        ORDER BY ic.incomecode
      `;

      console.log('Summary Query being sent:', query); 
      console.log('Summary Params object being sent:', params);

      // Pass the 'params' object to .inputs()
      result = await request(query).inputs(params).run();
      res.json(result.recordset);

    } else { // mode === 'details'
      const query = `
        SELECT
          ml.remark AS code,
          DATE_FORMAT(ml.transdate, '%Y-%m-%d') AS date,
          ml.amount,
          CONCAT(IFNULL(ml.phoneno, ''), '(', IFNULL(m.Surname, ''), ' ', IFNULL(m.othernames, ''), ')') AS phoneno_name,
          ml.remark AS transaction_description
        FROM memberledger ml
        LEFT JOIN members m ON ml.phoneno = m.PhoneNumber
        ${whereClause}
        ORDER BY ml.remark, ml.transdate`;

      console.log('Details Query being sent:', query);
      console.log('Details Params object being sent:', params);

      // Pass the 'params' object to .inputs()
      const queryResult = await request(query).inputs(params).run();

      const groupedResults = queryResult.recordset.reduce((acc, row) => {
        const code = row.code;
        if (!acc[code]) {
          acc[code] = {
            code: code,
            transactions: []
          };
        }
        acc[code].transactions.push({
          date: row.date,
          phoneno_name: row.phoneno_name,
          amount: row.amount,
          transaction_description: row.transaction_description || ''
        });
        return acc;
      }, {});

      const formattedResults = Object.values(groupedResults);
      res.json(formattedResults);
    }

  } catch (err) {
    console.error('OCDA Income Analysis error:', err);
    res.status(500).json({ message: 'Server error', details: err.sqlMessage || err.message });
  }
});

// GET /admin/members-summary
router.get('/members-summary', verifyToken, async (req, res) => {
  try {
    const result = await request(`
      SELECT Quarters, Ward
      FROM members
      WHERE 
        Quarters IS NOT NULL AND Quarters <> ''
        AND Ward IS NOT NULL AND Ward <> ''
    `).run();

    const members = result.recordset;
    const quartersSet = new Set();
    const wardsSet = new Set();

    members.forEach(m => {
      quartersSet.add(m.Quarters);
      wardsSet.add(m.Ward);
    });

    const quarters = Array.from(quartersSet).sort();
    const wards = Array.from(wardsSet).sort();

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

  if (!title || !content || !type) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!created_by) {
    return res.status(401).json({ message: 'Invalid or missing admin token.' });
  }

  try {
    await request(`
      INSERT INTO notices (title, content, type, created_by)
      VALUES (@title, @content, @type, @created_by)
    `)
    .inputs({ title, content, type, created_by })
    .run();

    res.json({ success: true, message: 'Notice/Event posted' });

  } catch (err) {
    console.error('Error posting notice:', err);
    res.status(500).json({ message: 'Failed to post notice/event', error: err.message });
  }
});

// GET: All notices/events (for both admin and member dashboards)
router.get('/notices', async (req, res) => {
  try {
    
    const result = await request
      `SELECT id, title, content, type, created_at FROM notices ORDER BY created_at DESC`.run();
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notices/events' });
  }
});

//Edit Notice/Event
router.put('/notices/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, type } = req.body;

  if (!title || !content || !type) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const result = await request(`
      UPDATE notices 
      SET title = @title, content = @content, type = @type
      WHERE id = @id
    `)
    .inputs({ id, title, content, type })
    .run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Notice not found.' });
    }

    res.json({ success: true, message: 'Notice updated successfully.' });

  } catch (err) {
    console.error('Error updating notice:', err);
    res.status(500).json({ message: 'Failed to update notice' });
  }
});

//delete Notice/Event
router.delete('/notices/:id', verifyToken, async (req, res) => {
  try {
     const {id} = req.params;
    const result = await request
    `DELETE FROM notices WHERE id = @id`
      .inputs({id})
      .run();
      

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Notice not found.' });
    }

    res.json({ success: true, message: 'Notice deleted successfully.' });
  } catch (err) {
    console.error('Error deleting notice:', err);
    res.status(500).json({ message: 'Failed to delete notice' });
  }
});

//Change PhoneNumber
router.put('/change-phone', verifyToken, async (req, res) => {
    const { oldPhone, newPhone } = req.body;

    if (!oldPhone || !newPhone) {
        return res.status(400).json({ message: 'Both old and new phone numbers are required.' });
    }

    // Initialize an empty connection variable for the transaction
    let connection; 

    try {
        // --- Step 1: Check if old phone exists (using db-wrapper) ---
        const oldCheck = await request(`
            SELECT 1 FROM members WHERE PhoneNumber = @oldPhone
        `)
        .inputs({ oldPhone })
        .run();

        if (oldCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Old phone number not found.' });
        }

        // --- Step 2: Check if new phone already exists (using db-wrapper) ---
        const newCheck = await request(`
            SELECT 1 FROM members WHERE PhoneNumber = @newPhone
        `)
        .inputs({ newPhone })
        .run();

        if (newCheck.recordset.length > 0) {
            return res.status(409).json({ message: 'New phone number already exists.' });
        }

        // --- Step 3: Begin Transaction (direct mysql2/promise interaction) ---
        // Get a connection from the pool for the transaction
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Start the transaction

        try {
            // --- Step 4: Update in `members` table ---
            // Using '?' placeholders for direct mysql2/promise execute method
            const updateMembersQuery = `
                UPDATE members SET PhoneNumber = ? WHERE PhoneNumber = ?
            `;
            await connection.execute(updateMembersQuery, [newPhone, oldPhone]);

            // --- Step 5: Update in `memberledger` table ---
            const updateLedgerQuery = `
                UPDATE memberledger SET phoneno = ? WHERE phoneno = ?
            `;
            await connection.execute(updateLedgerQuery, [newPhone, oldPhone]);

            // --- Step 6: Commit Transaction ---
            await connection.commit();
            res.status(200).json({ message: 'Phone number updated successfully in all records.' });

        } catch (transactionErr) {
            // --- Step 7: Rollback Transaction on error ---
            await connection.rollback();
            console.error('Transaction error:', transactionErr);
            res.status(500).json({ message: 'Transaction failed. Changes rolled back.' });
        } finally {
            // Ensure the connection is released back to the pool
            if (connection) {
                connection.release();
            }
        }

    } catch (err) {
        console.error('Change Phone Server Error:', err);
        // Ensure connection is released even if initial checks fail before transaction starts
        if (connection) { 
            connection.release();
        }
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/merge-phone', verifyToken, async (req, res) => {
  const { firstPhone, secondPhone } = req.body;

  if (!firstPhone || !secondPhone || firstPhone === secondPhone) {
    return res.status(400).json({ message: 'Both phone numbers are required and must be different.' });
  }

  let connection; // For managing transaction safely

  try {
    // --- Step 1: Check if both phone numbers exist ---
    const checkPhones = await request(`
      SELECT PhoneNumber FROM members WHERE PhoneNumber IN (@firstPhone, @secondPhone)
    `)
    .inputs({ firstPhone, secondPhone })
    .run();

    if (checkPhones.recordset.length < 2) {
      return res.status(404).json({ message: 'One or both phone numbers not found in members table.' });
    }

    // --- Step 2: Start transaction ---
    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // --- Step 3: Reassign memberledger entries from second to first ---
      const updateLedgerQuery = `
        UPDATE memberledger SET phoneno = ? WHERE phoneno = ?
      `;
      await connection.execute(updateLedgerQuery, [firstPhone, secondPhone]);

      // --- Step 4: Delete second phone from members ---
      const deleteSecondMember = `
        DELETE FROM members WHERE PhoneNumber = ?
      `;
      await connection.execute(deleteSecondMember, [secondPhone]);

      // --- Step 5: Commit transaction ---
      await connection.commit();
      res.status(200).json({ message: 'Phone numbers merged successfully.' });

    } catch (transactionErr) {
      await connection.rollback();
      console.error('Merge Transaction Error:', transactionErr);
      res.status(500).json({ message: 'Transaction failed. Changes rolled back.' });

    } finally {
      if (connection) connection.release();
    }

  } catch (err) {
    console.error('Merge Phone Server Error:', err);
    if (connection) connection.release();
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;