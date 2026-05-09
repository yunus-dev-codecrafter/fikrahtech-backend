require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const allRoutes = require('./routes'); // Import the consolidated routes

app.use(cors({
  origin: ['https://fikrah.netlify.app', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json()); // For parsing application/json request bodies

// Mount all routes under /api
app.use('/api', allRoutes);

// Basic error handling middleware (can be expanded)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
