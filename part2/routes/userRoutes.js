/* eslint-disable linebreak-style */
const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login (dummy version)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE email = ? AND password_hash = ?
    `, [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  console.log('🔥  LOGIN BODY:', req.body);

  const { username, password } = req.body;

  try {
    // 1) Check which database we're talking to
    const [dbInfo] = await db.query(`SELECT DATABASE() AS db`);
    console.log('🗄️  Connected to database:', dbInfo[0].db);

    // 2) Fetch the user row
    const [rows] = await db.query(
      `SELECT user_id, username, role, password_hash
         FROM Users
        WHERE username = ?`,
      [username]
    );
    console.log('📋  DB rows:', rows);

    // 3) If no row or password mismatch, fail
    if (rows.length === 0) {
      console.log('❌  No user found for', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userRow = rows[0];
    console.log(
      '🔐  Comparing provided:',
      JSON.stringify(password),
      'to stored:',
      JSON.stringify(userRow.password_hash)
    );

    if (password !== userRow.password_hash) {
      console.log('❌  Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4) Success!
    req.session.user = {
      user_id: userRow.user_id,
      username: userRow.username,
      role: userRow.role
    };
    console.log('✅  Login successful for', req.session.user);
    res.json({ message: 'Login successful', user: req.session.user });

  } catch (err) {
    console.error('💥  LOGIN ERROR:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/users/me
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST /api/users/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
