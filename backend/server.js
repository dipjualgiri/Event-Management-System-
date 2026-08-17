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
    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);

    if (existing) {
      return res.status(409).json({ success: false, message: 'That email is already registered.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), cleanEmail, hashedPassword]
    );

    return res.json({ success: true, message: 'Account created successfully!' });
  } catch (err) {
    console.error('Signup error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Database failure during signup: ' + (err.message || 'Unknown error') });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const db = await connectDB();
    const cleanEmail = email.toLowerCase().trim();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Database failure during login: ' + (err.message || 'Unknown error') });
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
      [
        fullName.trim(),
        email.toLowerCase().trim(),
        phone.trim(),
        event.trim(),
        Number(tickets) || 1,
        notes ? notes.trim() : ''
      ]
    );

    return res.json({ success: true, message: 'Successfully registered for the event!' });
  } catch (err) {
    console.error('Registration error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Database failure during registration: ' + (err.message || 'Unknown error') });
  }
});

app.get('/api/registrations', async (req, res) => {
  try {
    const db = await connectDB();
    const registrations = await db.all('SELECT * FROM registrations ORDER BY id DESC');
    return res.json({ success: true, registrations: registrations || [] });
  } catch (err) {
    console.error('Fetch registrations error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Could not fetch registrations.' });
  }
});

app.delete('/api/registrations/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid registration ID.' });
  }

  try {
    const db = await connectDB();
    await db.run('DELETE FROM registrations WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Registration removed successfully.' });
  } catch (err) {
    console.error('Delete registration error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to remove registration.' });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;