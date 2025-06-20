/* eslint-disable linebreak-style */
const express = require('express');
const path = require('path');
require('dotenv').config();

const part1App = require('../part1/app');
const mysql = require('mysql2/promise');
const session = require('express-session');
const app = express();

// Middleware
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'alksjdha;sogihnasidvnfasvga',
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, '/public')));

let db;
async function initDb() {
  // 1) run your schema file
  const setup = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
  });
  const ddl = fs.readFileSync(path.join(__dirname, 'dogwalks.sql'), 'utf8');
  await setup.query(ddl);
  await setup.end();

  // 2) connect to DogWalkService
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
  });
}

// ─── DOGS ENDPOINT ───────────────────────────────────────────────────────────
// GET /api/dogs → list all dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Dogs');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;
