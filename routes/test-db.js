const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

// Simple database test route
router.get('/test-db', async (req, res) => {
  try {
    // Using await to wait for the database query to complete
    // This is the Promise pattern - async/await makes the code wait
    // for the database to respond before sending data to frontend
    const [results] = await sequelize.query('SELECT 1 + 1 AS result');
    
    res.json({
      success: true,
      message: 'Database connection successful!',
      data: results[0] // Returns: { result: 2 }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router;
