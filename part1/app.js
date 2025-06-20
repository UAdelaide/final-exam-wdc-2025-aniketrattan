const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql2/promise');
const fs = require('fs');

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let db;

(async () => {
    try {
        const setup = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            multipleStatements: true
        });
        const ddl = fs.readFileSync(path.join(__dirname, 'dogwalks.sql'), 'utf8');
        await setup.query(ddl);
        await setup.end();

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
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/walkrequests/open', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT
         wr.request_id,
         d.name             AS dog_name,
         wr.requested_time,
         wr.duration_minutes,
         wr.location,
         u.username         AS owner_username
       FROM WalkRequests AS wr
       JOIN Dogs         AS d  ON wr.dog_id    = d.dog_id
       JOIN Users        AS u  ON d.owner_id   = u.user_id
       WHERE wr.status = 'open'`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/walkers/summary', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT
         u.username                   AS walker_username,
         COUNT(wr.rating_id)          AS total_ratings,
         AVG(wr.rating)               AS average_rating,
         COUNT(wr.rating_id)          AS completed_walks
       FROM Users AS u
       LEFT JOIN WalkRatings AS wr
         ON u.user_id = wr.walker_id
       WHERE u.role = 'walker'
       GROUP BY u.username`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT);
