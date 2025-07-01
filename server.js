const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const { sql, pool, poolConnect } = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const app = express();
const router = express.Router();
const adminRoutes = require('./routes/admin');
const config = require('./dbconfig'); 
const PORT = 5500;



app.use(cors({
  origin: 'http://localhost:5500',  // ✅ your frontend
  credentials: true                 // ✅ allow cookies
}));
app.use(express.json());
app.use('/admin', adminRoutes);
app.use('/admin', require('./routes/admin'));


// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', serveIndex(path.join(__dirname, 'public'), { icons: true }));

app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: true
}));

const verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ message: 'No token provided' });

  // Strip "Bearer " prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
    req.adminId = decoded.id;
    next();
  });
};

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


// Dummy login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        res.json({ success: true, token: 'fake-jwt-token' });
    } else {
        res.status(400).json({ success: false, message: 'Missing credentials' });
    }
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Signup Endpoint

app.post('/signup', async (req, res) => {
  try {
    const userData = req.body;
    console.log('Signup data received:', userData);

    const checkRequest = (await poolConnect).request();
    const check = await checkRequest
      .input('PhoneNumber', sql.VarChar, userData.phoneNumber)
      .query(`SELECT * FROM Members WHERE PhoneNumber = @PhoneNumber`);

    if (check.recordset.length > 0) {
      return res.status(400).json({ field: 'phoneNumber', message: 'Phone number already exists' });
    }

    const insertRequest = (await poolConnect).request();
    const result = await insertRequest
      .input('Surname', sql.VarChar, userData.surname)
      .input('othernames', sql.VarChar, userData.otherNames)
      .input('email', sql.VarChar, userData.email || '')
      .input('Sex', sql.VarChar, userData.sex)
      .input('DOB', sql.Date, userData.dob)
      .input('Quarters', sql.VarChar, userData.quarters)
      .input('Ward', sql.VarChar, userData.ward)
      .input('Town', sql.VarChar, userData.town)
      .input('State', sql.VarChar, userData.state)
      .input('PhoneNumber', sql.VarChar, userData.phoneNumber)
      .input('phoneno2', sql.VarChar, userData.phoneNo2)
      .input('Password', sql.VarChar, userData.password)
      .input('Title', sql.VarChar, userData.title)
      .input('HonTitle', sql.VarChar, userData.honTitle)
      .input('Qualifications', sql.VarChar, userData.qualifications)
      .input('Profession', sql.VarChar, userData.profession)
      .input('exitdate', sql.Date, userData.exitDate || null)
      .input('CreatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Members 
        (othernames, Surname, email, Sex, DOB, Quarters, Ward, Town, State, PhoneNumber, Password, CreatedAt, phoneno2, Title, HonTitle, Qualifications, Profession, exitdate)
        OUTPUT INSERTED.Id
        VALUES 
        (@othernames, @Surname, @email, @Sex, @DOB, @Quarters, @Ward, @Town, @State, @PhoneNumber, @Password, @CreatedAt, @phoneno2, @Title, @HonTitle, @Qualifications, @Profession, @exitdate)
      `);

    const newUserId = result.recordset[0].Id;

    req.session.phoneNumber = userData.phoneNumber;

    res.status(201).json({
      message: 'Signup successful!',
      id: newUserId,
      phoneNumber: userData.phoneNumber
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed. Try again later.' });
  }
});


// Login Endpoint
app.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // can be ID or phone number

    const request = (await poolConnect).request();

    let field, sqlType;

    if (/^\d+$/.test(identifier) && Number(identifier) <= 2147483647) {
      field = 'Id';
      sqlType = sql.Int;
      request.input('Identifier', sqlType, parseInt(identifier, 10));
    } else {
      field = 'PhoneNumber';
      sqlType = sql.VarChar;
      request.input('Identifier', sqlType, identifier);
    }

    const userResult = await request.query(`SELECT * FROM Members WHERE ${field} = @Identifier`);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ field: 'identifier', message: `${field} not found` });
    }

    const user = userResult.recordset[0];

    if (user.Password !== password) {
      return res.status(400).json({ field: 'password', message: 'Incorrect password' });
    }

    req.session.userId = user.Id;

    res.status(200).json({ message: 'Login successful', id: user.Id, phoneNumber: user.PhoneNumber });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed, server error' });
  }
});




// dashboard Endpoint//

app.post('/api/profile', async (req, res) => { 
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number required' });
    }

    const request = (await poolConnect).request();
    const result = await request
      .input('PhoneNumber', sql.VarChar, phoneNumber)
      .query(`
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
        FROM Members
        WHERE PhoneNumber = @PhoneNumber
      `);

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
  console.log("Serving dashboard from:", filePath); // Debug line
  res.sendFile(filePath);
});

//update profile route
app.post('/api/update-profile', async (req, res) => {
  const {
    oldPhoneNumber,
    phone,
    phoneNo2,
    email,
    state,
    sex,
    title,
    honTitle,
    quarters,
    ward,
    town,
    qualifications,
    profession,
    exitDate
  } = req.body;

  if (!oldPhoneNumber) {
    return res.status(400).json({ message: 'Current phone number is required' });
  }

  try {
    await sql.connect(config);

    const updates = [];
    const inputs = [];

    if (phone) {
      updates.push('PhoneNumber = @newPhone');
      inputs.push({ name: 'newPhone', type: sql.VarChar, value: phone });
    }
    if (phoneNo2) {
      updates.push('phoneno2 = @phoneNo2');
      inputs.push({ name: 'phoneNo2', type: sql.VarChar, value: phoneNo2 });
    }
    if (email) {
      updates.push('email = @email');
      inputs.push({ name: 'email', type: sql.VarChar, value: email });
    }
    if (state) {
      updates.push('State = @state');
      inputs.push({ name: 'state', type: sql.VarChar, value: state });
    }
    if (sex) {
      updates.push('Sex = @sex');
      inputs.push({ name: 'sex', type: sql.VarChar, value: sex });
    }
    if (title) {
      updates.push('Title = @title');
      inputs.push({ name: 'title', type: sql.VarChar, value: title });
    }
    if (honTitle) {
      updates.push('HonTitle = @honTitle');
      inputs.push({ name: 'honTitle', type: sql.VarChar, value: honTitle });
    }
    if (quarters) {
      updates.push('Quarters = @quarters');
      inputs.push({ name: 'quarters', type: sql.VarChar, value: quarters });
    }
    if (ward) {
      updates.push('Ward = @ward');
      inputs.push({ name: 'ward', type: sql.VarChar, value: ward });
    }
    if (town) {
      updates.push('Town = @town');
      inputs.push({ name: 'town', type: sql.VarChar, value: town });
    }
    if (qualifications) {
      updates.push('Qualifications = @qualifications');
      inputs.push({ name: 'qualifications', type: sql.VarChar, value: qualifications });
    }
    if (profession) {
      updates.push('Profession = @profession');
      inputs.push({ name: 'profession', type: sql.VarChar, value: profession });
    }
    if (exitDate) {
      updates.push('exitdate = @exitDate');
      inputs.push({ name: 'exitDate', type: sql.Date, value: exitDate });
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const pool = await sql.connect(config);
    const request = pool.request();
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    request.input('oldPhoneNumber', sql.VarChar, oldPhoneNumber);

    const updateQuery = `
      UPDATE Members
      SET ${updates.join(', ')}
      WHERE PhoneNumber = @oldPhoneNumber
    `;

    await request.query(updateQuery);

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
    const result = await sql.query`
      UPDATE [dbo].[Members]
      SET [Password] = ${newPassword}
      WHERE [PhoneNumber] = ${phoneNumber}
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Optional: depends on session setup
    res.status(200).json({ message: 'Logged out successfully' });
  });
});


//Fetch Individual Ledger Receipts

app.get('/api/ledger-entry/:phoneno', async (req, res) => {
  const { phoneno } = req.params;
  try {
    const result = await sql.query`SELECT * FROM memberledger WHERE phoneno = ${phoneno}`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
});

//. Fetch Enquiries by Ward
app.get('/api/enquiry/:type/:value', async (req, res) => {
  const { type, value } = req.params;

  if (!['ward', 'quarters'].includes(type)) {
    return res.status(400).json({ message: 'Invalid filter type' });
  }

  try {
    const pool = await sql.connect(config);
    const query = `
      SELECT * FROM memberledger 
      WHERE phoneno IN (
        SELECT PhoneNumber FROM Members 
        WHERE ${type} = @value
      )
    `;

    const result = await pool.request()
      .input('value', sql.VarChar, value)
      .query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error('Enquiry error:', err);
    res.status(500).json({ message: 'Server error during enquiry' });
  }
});







app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
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









/*app.get('/api/profile', (req, res) => {
    res.json({
        age: 30,
        phoneNo: '+234 801 234 5678',
        honors: 'Cum Laude',
        exitDate: '2025-12-31',
        town: 'Benin City',
        state: 'Edo',
        ward: 'Oredo Ward 1',
        quarters: 'GRA Phase II',
        qualifications: ['B.Sc. Computer Science', 'PMP Certification']
    });
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

*/


/*const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');

const app = express();
const port = 5500;

// Add user-agent to avoid being blocked
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Node.js RSS Reader)',
  },
});

app.use(cors());
app.use(express.static('public'));

app.get('/news', async (req, res) => {
  try {
    const feed = await parser.parseURL('https://feeds.bbci.co.uk/news/world/rss.xml');
    const articles = feed.items.map(item => {
      const media = item['media:content'] || item['media:thumbnail'];
      const imageUrl = media && media.$ && media.$.url ? media.$.url : null;

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        image: imageUrl
      };
    });

    res.json(articles);
  } catch (err) {
    console.error('❌ Failed to fetch news:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});*/


