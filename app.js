require('dotenv').config();
const express = require('express');
const app = express();
const allRoutes = require('./routes'); // Import the consolidated routes

app.use(express.json()); // For parsing application/json request bodies

// Mount all routes under /api
app.use('/api', allRoutes);

// Basic error handling middleware (can be expanded)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
