/* eslint-disable linebreak-style */
const express = require('express');
const path = require('path');
require('dotenv').config();

const session = require('express-session');
const dogsApiApp = require('../part1/app');
const app = express();
app.use(dogsApiApp);

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

// Export the app instead of listening here
module.exports = app;
