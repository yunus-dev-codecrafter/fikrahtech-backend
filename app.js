require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const allRoutes = require('./routes'); // Import the consolidated routes

app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app', // Replace with your actual Vercel domain
    'http://localhost:3000',
    'http://localhost:5173', // Common Vite dev port
    'http://localhost:3001'  // Alternative dev port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies if needed for authentication
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
