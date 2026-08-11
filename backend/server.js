require('dotenv').config();
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => res.redirect('/signup.html'));

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const db = await connectDB();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);

    if (existing) {
      return res.status(409).json({ success: false, message: 'That email is already registered.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    return res.json({ success: true, message: 'Account created!' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const db = await connectDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.json({ success: true, message: `Welcome back, ${user.name}!` });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { fullName, email, phone, event, tickets, notes } = req.body;

  if (!fullName || !email || !phone || !event) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  try {
    const db = await connectDB();
    await db.run(
      'INSERT INTO registrations (full_name, email, phone, event, tickets, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, email, phone, event, tickets || 1, notes || '']
    );

    return res.json({ success: true, message: 'Successfully registered for the event!' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete registration.' });
  }
});

app.get('/api/registrations', async (req, res) => {
  try {
    const db = await connectDB();
    const registrations = await db.all('SELECT * FROM registrations ORDER BY id DESC');
    return res.json({ success: true, registrations });
  } catch (err) {
    console.error('Fetch registrations error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch registrations.' });
  }
});
app.delete('/api/registrations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await connectDB();
    await db.run('DELETE FROM registrations WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Registration removed successfully.' });
  } catch (err) {
    console.error('Delete registration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove registration.' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

}

module.exports = app;