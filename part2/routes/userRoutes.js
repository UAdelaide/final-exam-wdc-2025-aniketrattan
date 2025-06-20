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

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      `SELECT user_id, username, role, password_hash
         FROM Users
        WHERE username = ?`,
      [username]
    );
    if (rows.length === 0 || password !== rows[0].password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // store user in session
    req.session.user = {
      user_id: rows[0].user_id,
      username: rows[0].username,
      role: rows[0].role
    };
    res.json({ user: req.session.user });

  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/users/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    // remove the session cookie in the browser
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// Returns the list of dogs belonging to the logged-in owner
router.get('/dogs', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
+  }
+  try {
+    const ownerId = req.session.user.user_id;
+    const [rows] = await db.query(
+      'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
+      [ownerId]
+    );
+    res.json(rows);
+  } catch (err) {
+    res.status(500).json({ error: 'Failed to load dogs' });
+  }
+});


module.exports = router;
