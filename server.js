const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const { sql, pool, poolConnect } = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 5500;


app.use(cors({
  origin: 'http://localhost:5500',  // ✅ your frontend
  credentials: true                 // ✅ allow cookies
}));
app.use(express.json());

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', serveIndex(path.join(__dirname, 'public'), { icons: true }));

app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: true
}));

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

    // 1. Check if phone number already exists
    const checkRequest = (await poolConnect).request();
    const check = await checkRequest
      .input('PhoneNumber', sql.VarChar, userData.phoneNumber)
      .query(`SELECT * FROM Users WHERE PhoneNumber = @PhoneNumber`);

    if (check.recordset.length > 0) {
      return res.status(400).json({ field: 'phoneNumber', message: 'Phone number already exists' });
    }

    // 2. Insert new user using a NEW request
    const insertRequest = (await poolConnect).request();
    await insertRequest
      .input('FirstName', sql.VarChar, userData.firstName)
      .input('Surname', sql.VarChar, userData.surname)
      .input('Sex', sql.VarChar, userData.sex)
      .input('DOB', sql.Date, userData.dob)
      .input('Quarters', sql.VarChar, userData.quarters)
      .input('Ward', sql.VarChar, userData.ward)
      .input('Town', sql.VarChar, userData.town)
      .input('State', sql.VarChar, userData.state)
      .input('PhoneNumber', sql.VarChar, userData.phoneNumber)
      .input('Password', sql.VarChar, userData.password)
      .input('CreatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Users 
        (FirstName, Surname, Sex, DOB, Quarters, Ward, Town, State, PhoneNumber, Password, CreatedAt)
        VALUES 
        (@FirstName, @Surname, @Sex, @DOB, @Quarters, @Ward, @Town, @State, @PhoneNumber, @Password, @CreatedAt)
      `);

    req.session.phoneNumber = userData.phoneNumber;
    res.status(200).json({ message: 'Signup successful!' });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed. Try again later.' });
  }
});





// Login Endpoint
app.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const request = (await poolConnect).request();

    const result = await request
      .input('PhoneNumber', sql.VarChar, phoneNumber)
      .query('SELECT * FROM Users WHERE PhoneNumber = @PhoneNumber');

    if (result.recordset.length === 0) {
      return res.status(400).json({ field: 'phone', message: 'Phone number not found' });
    }

    const user = result.recordset[0];
    if (user.Password !== password) {
      return res.status(400).json({ field: 'password', message: 'Wrong password' });
    }

    // ✅ Save user phoneNumber in session
    req.session.phoneNumber = user.PhoneNumber;
    res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong during login' });
  }
});
// 



// dashboard Endpoint//

app.get('/api/profile', async (req, res) => {
  try {
    const phoneNumber = req.session.phoneNumber;

    if (!phoneNumber) {
      return res.status(401).json({ message: 'No user is logged in.' });
    }

    const request = (await poolConnect).request();
    const result = await request
      .input('PhoneNumber', sql.VarChar, phoneNumber)
      .query('SELECT * FROM Users WHERE PhoneNumber = @PhoneNumber');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.recordset[0];

    const profile = {
      age: new Date().getFullYear() - new Date(user.DOB).getFullYear(),
      username: user.FirstName + ' ' + user.Surname,
      phoneNo: user.PhoneNumber,
      honors: user.HonTitle,
      exitDate: user.ExitDate,
      town: user.Town,
      state: user.State,
      ward: user.Ward,
      quarters: user.Quarters,
      qualifications: user.Qualifications?.split(','),
    };

    res.json(profile);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});




app.get('/dashboard', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'dashboard.html');
  console.log("Serving dashboard from:", filePath); // Debug line
  res.sendFile(filePath);
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
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


