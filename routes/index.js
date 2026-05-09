const express = require('express');
const router = express.Router();

const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const { verifyToken, isAdmin } = require('../middleware/verifyToken'); // Add this near the top

// Apply authentication middleware to admin routes
router.use('/admin', verifyToken, isAdmin);
router.use('/admin', adminRoutes);

router.use('/auth', authRoutes); // Add this near router.use('/admin'...)

module.exports = router;