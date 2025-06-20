const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure  DB connection pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'YOUR_DB_USER',
    password: 'YOUR_DB_PASS',
    database: 'DogWalkService'
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
