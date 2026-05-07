const express = require('express');
const router = express.Router();

const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes'); // Add this near the top

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes); // Add this near router.use('/admin'...)

module.exports = router;