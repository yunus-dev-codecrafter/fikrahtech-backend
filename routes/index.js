const express = require('express');
const router = express.Router();

const adminRoutes = require('./adminRoutes');
// const authRoutes = require('./authRoutes'); // Future: for login, etc.

router.use('/admin', adminRoutes);
// router.use('/auth', authRoutes);

module.exports = router;