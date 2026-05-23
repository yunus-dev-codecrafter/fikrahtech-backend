const express = require('express');
const router = express.Router();

const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const schoolRoutes = require('./schoolRoutes');
const proprietorRoutes = require('./proprietorRoutes');
const testDbRoutes = require('./test-db');
const { verifyToken, isAdmin } = require('../middleware/verifyToken');

// Apply authentication middleware to admin routes
router.use('/admin', verifyToken, isAdmin);
router.use('/admin', adminRoutes);

// Apply authentication middleware to school routes
router.use('/school', verifyToken);
router.use('/school', schoolRoutes);

// Proprietor routes
router.use('/proprietor', proprietorRoutes);

router.use('/auth', authRoutes);
router.use('/', testDbRoutes); // This makes /api/test-db available

module.exports = router;