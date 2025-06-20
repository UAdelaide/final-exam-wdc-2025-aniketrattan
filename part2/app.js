/* eslint-disable linebreak-style */
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const session = require('express-session');
const app = express();

let db;

(async () => {
    try {
        // 1a) run your schema file (only if you still need to auto-create/tidy your DB)
        const setup = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            multipleStatements: true
        });
        const ddl = fs.readFileSync(path.join(__dirname, 'dogwalks.sql'), 'utf8');
        await setup.query(ddl);
        await setup.end();

        // 1b) open your actual DogWalkService database
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });
    } catch (err) {
        process.exit(1);
    }
})();

// Middleware
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.get('/api/dogs', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT
         d.dog_id    AS dog_id,
         d.name      AS name,
         d.size      AS size,
         d.owner_id  AS owner_id
       FROM Dogs AS d`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Export the app instead of listening here
module.exports = app;
