// part1/app.js

const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const logger       = require('morgan');
const mysql        = require('mysql2/promise');
const fs           = require('fs');

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // 1) Connect without a database so we can run the entire dogwalks.sql (which creates DB + tables)
    const setup = await mysql.createConnection({
      host: 'localhost',
      user: 'root',       // ← change if your MySQL user is different
      password: '',       // ← change if you have a password
      multipleStatements: true
    });

    // 2) Load & execute the DDL from dogwalks.sql
    const ddl = fs.readFileSync(
      path.join(__dirname, 'dogwalks.sql'),
      'utf8'
    );
    await setup.query(ddl);
    await setup.end();

    // 3) Now open our normal connection to the DogWalkService database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',       // ← change as needed
      password: '',
      database: 'DogWalkService'
    });

    console.log('✅ Database ready');
  } catch (err) {
    console.error('❌ DB setup error—ensure MySQL is running:', err);
    process.exit(1);
  }
})();

// GET /api/dogs
// Returns a list of all dogs with their size and owner’s username
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         d.name         AS dog_name,
         d.size         AS size,
         u.username     AS owner_username
       FROM Dogs AS d
       JOIN Users AS u
         ON d.owner_id = u.user_id`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in GET /api/dogs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
