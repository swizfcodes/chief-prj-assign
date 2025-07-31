const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const {  request } = require('./db-wrapper');
const pool = require('./db');
const path = require('path');
const cors = require('cors');
const app = express();
const adminRoutes = require('./routes/admin');
const PORT = process.env.PORT || 5500;

app.use(cors({
  origin: [
    'http://localhost:5500',        // local frontend
    'http://127.0.0.1:5500',
    'https://oyinakokocda.org',       
    // production
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,         // true for HTTPS
    sameSite: 'lax'        // important for cookies across origin
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/admin', adminRoutes);

// Signup Endpoint
app.post('/signup', async (req, res) => {
  try {
    const userData = req.body;
    console.log('Signup data received:', userData);

    const checkResult = await request(`
      SELECT * FROM members WHERE PhoneNumber = @PhoneNumber
    `).inputs({ PhoneNumber: userData.phoneNumber }).run();

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ field: 'phoneNumber', message: 'Phone number already exists' });
    }

    const insertInputs = {
      othernames: userData.otherNames,
      Surname: userData.surname,
      email: userData.email || '',
      Sex: userData.sex,
      DOB: userData.dob,
      Quarters: userData.quarters,
      Ward: userData.ward,
      Town: userData.town,
      State: userData.state,
      PhoneNumber: userData.phoneNumber,
      phoneno2: userData.phoneNo2 || null,
      Password: userData.password,
      Title: userData.title,
      HonTitle: userData.honTitle,
      Qualifications: userData.qualifications || null,
      Profession: userData.profession,
      exitdate: userData.exitDate || null,
      CreatedAt: new Date(),
    };

    const insertQuery = `
      INSERT INTO members 
      (othernames, Surname, email, Sex, DOB, Quarters, Ward, Town, State, PhoneNumber, Password, CreatedAt, phoneno2, Title, HonTitle, Qualifications, Profession, exitdate)
      VALUES 
      (@othernames, @Surname, @email, @Sex, @DOB, @Quarters, @Ward, @Town, @State, @PhoneNumber, @Password, @CreatedAt, @phoneno2, @Title, @HonTitle, @Qualifications, @Profession, @exitdate)
    `;

    await request(insertQuery).inputs(insertInputs).run();

    if (req.session) {
      req.session.phoneNumber = userData.phoneNumber;
    } else {
      console.warn('⚠️ Session middleware is missing.');
    }

    res.status(201).json({
      message: 'Signup successful!',
      phoneNumber: userData.phoneNumber
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed. Try again later.' });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  let conn;
  try {
    const { identifier, password } = req.body;
    console.log('Login request received:', identifier, password);

    conn = await pool.getConnection();
    console.log('DB connection established');

    let field, value;
    if (/^\d+$/.test(identifier) && Number(identifier) <= 2147483647) {
      field = 'Id';
      value = parseInt(identifier, 10);
    } else {
      field = 'PhoneNumber';
      value = identifier;
    }

    console.log(`Searching by ${field}:`, value);

    const [rows] = await conn.execute(
      `SELECT * FROM members WHERE ${field} = ? LIMIT 1`,
      [value]
    );

    if (rows.length === 0) {
      console.log('❌ No user found');
      return res.status(400).json({ field: 'identifier', message: `${field} not found` });
    }

    const user = rows[0];
    console.log('👤 User found:', user);

    if (user.Password !== password) {
      console.log('Password mismatch');
      return res.status(400).json({ field: 'password', message: 'Incorrect password' });
    }

    req.session.userId = user.Id;
    console.log('Login successful');

    res.status(200).json({
      message: 'Login successful',
      id: user.Id,
      phoneNumber: user.PhoneNumber,
    });

  } catch (err) {
    console.error('❌ Login error:', err); // full error
    res.status(500).json({ message: 'Login failed, server error' });
  } finally {
    if (conn) conn.release();
  }
});


// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/public', serveIndex(path.join(__dirname, 'public'), { icons: true }));

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});


// Dummy login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        res.json({ success: true, token: 'fake-jwt-token' });
    } else {
        res.status(400).json({ success: false, message: 'Missing credentials' });
    }
});

// dashboard Endpoint//

app.post('/api/profile', async (req, res) => { 
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number required' });
    }

    const result = await request`
      SELECT 
        othernames,
        Surname,
        PhoneNumber,
        phoneno2,
        Town,
        email,
        State,
        Ward,
        Quarters,
        DOB,
        Title,
        HonTitle,
        exitdate,
        Qualifications
      FROM members
      WHERE PhoneNumber = ${phoneNumber}
    `.run();

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.recordset[0];
    const dob = new Date(user.DOB);
    const age = new Date().getFullYear() - dob.getFullYear();

    res.status(200).json({
      othernames: user.othernames,
      surname: user.Surname,
      phoneNumber: user.PhoneNumber,
      phoneNo2: user.phoneno2,
      email: user.email,
      town: user.Town,
      state: user.State,
      ward: user.Ward,
      quarters: user.Quarters,
      age: age,
      title: user.Title,
      honTitle: user.HonTitle,
      exitDate: user.exitdate,
      qualifications: user.Qualifications 
    });

  } catch (err) {
    console.error('Error loading user profile:', err);
    res.status(500).json({ message: 'Server error while loading profile' });
  }
});


// Serve the dashboard HTML file

app.get('/dashboard', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'dashboard.html');
  res.sendFile(filePath);
});

//update profile route
app.post('/api/update-profile', async (req, res) => {
  const {
    oldPhoneNumber,
    phone,
    phoneNo2,
    surname,
    othernames,
    email,
    State,
    sex,
    title,
    honTitle,
    Quarters,
    Ward,
    town,
    qualifications,
    profession,
    exitDate
  } = req.body;

  if (!oldPhoneNumber) {
    return res.status(400).json({ message: 'Current phone number is required' });
  }

  try {
    const updates = [];
    const inputs = [];

    if (phone) {
      updates.push('PhoneNumber = @newPhone');
      inputs.push({ name: 'newPhone', value: phone });
    }
    if (phoneNo2) {
      updates.push('phoneno2 = @phoneNo2');
      inputs.push({ name: 'phoneNo2', value: phoneNo2 });
    }
    if (surname) {
      updates.push('Surname = @surname');
      inputs.push({ name: 'surname', value: surname });
    }
    if (othernames) {
      updates.push('othernames = @othernames');
      inputs.push({ name: 'othernames', value: othernames });
    }
    if (email) {
      updates.push('email = @email');
      inputs.push({ name: 'email', value: email });
    }
    if (State) {
      updates.push('State = @state');
      inputs.push({ name: 'state', value: State });
    }
    if (sex) {
      updates.push('Sex = @sex');
      inputs.push({ name: 'sex', value: sex });
    }
    if (title) {
      updates.push('Title = @title');
      inputs.push({ name: 'title', value: title });
    }
    if (honTitle) {
      updates.push('HonTitle = @honTitle');
      inputs.push({ name: 'honTitle', value: honTitle });
    }
    if (Quarters) {
      updates.push('Quarters = @quarters');
      inputs.push({ name: 'quarters', value: Quarters });
    }
    if (Ward) {
      updates.push('Ward = @ward');
      inputs.push({ name: 'ward', value: Ward });
    }
    if (town) {
      updates.push('Town = @town');
      inputs.push({ name: 'town', value: town });
    }
    if (qualifications) {
      updates.push('Qualifications = @qualifications');
      inputs.push({ name: 'qualifications', value: qualifications });
    }
    if (profession) {
      updates.push('Profession = @profession');
      inputs.push({ name: 'profession', value: profession });
    }
    if (exitDate) {
      updates.push('exitdate = @exitDate');
      inputs.push({ name: 'exitDate', value: exitDate });
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    inputs.push({ name: 'oldPhoneNumber', value: oldPhoneNumber });

    const query = `
      UPDATE members
      SET ${updates.join(', ')}
      WHERE PhoneNumber = @oldPhoneNumber
    `;

    const paramObject = Object.fromEntries(inputs.map(i => [i.name, i.value]));

    const result = await request(query)
      .inputs(paramObject)
      .run();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});


// Forgot Password Route
app.post('/api/reset-password', async (req, res) => {
  const { phoneNumber, newPassword } = req.body;

  if (!phoneNumber || !newPassword) {
    return res.status(400).json({ message: 'Phone number and new password are required' });
  }

  try {
    const result = await request`
      UPDATE members
      SET Password = ${newPassword}
      WHERE PhoneNumber = ${phoneNumber}
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


//Fetch Individual Ledger Receipts

app.get('/api/ledger-entry/:phoneno', async (req, res) => {
  const { phoneno } = req.params;
  try {
const result = await request`
        SELECT 
          phoneno, 
          amount, 
          remark, 
          DATE_FORMAT(transdate, '%Y-%m-%d') AS transdate, 
          paydate 
        FROM memberledger 
        WHERE phoneno = ${phoneno}
      `.run();
      
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
});

app.get('/api/member/ledger-entry/monthly-total', async (req, res) => {
  const { month, phoneno } = req.query;
  
  if (!month || !phoneno) {
    return res.status(400).json({ message: 'Missing month or phone number' });
  }
  
  try {
    // Using your adapter's correct syntax
    const result = await request(`
      SELECT SUM(amount) AS totalAmount
      FROM memberledger
      WHERE phoneno = @phoneno
      AND DATE_FORMAT(transdate, '%Y-%m') = @month
    `)
    .inputs({ phoneno, month })
    .run();
    
    const total = result.recordset[0]?.totalAmount || 0;
    res.json({ total });
    
  } catch (err) {
    console.error('Monthly total error:', err);
    res.status(500).json({ message: 'Server error calculating monthly total' });
  }
});

//. Fetch Enquiries by Ward
app.get('/api/enquiry/:type/:value', async (req, res) => {
  const { type, value } = req.params;
  const { from, to } = req.query;

  if (!['ward', 'quarters'].includes(type)) {
    return res.status(400).json({ message: 'Invalid filter type' });
  }

  try {
    let query = `
      SELECT ml.*, m.ward FROM memberledger ml
      JOIN members m ON ml.phoneno = m.PhoneNumber
      WHERE m.${type} = @value
    `;

    if (from) query += ` AND ml.transdate >= @from `;
    if (to) query += ` AND ml.transdate <= @to `;

    // Build inputs object
    const inputs = { value };
    if (from) inputs.from = from;
    if (to) inputs.to = to;

    // Use your custom wrapper correctly
    const result = await request(query).inputs(inputs).run();
    res.json(result.recordset);
  } catch (err) {
    console.error('Enquiry error:', err);
    res.status(500).json({ message: 'Server error during enquiry' });
  }
});

//logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});



process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason.stack || reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
