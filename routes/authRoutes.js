const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/verifyToken');

// This defines the /login part of the URL
router.post('/login', authController.login);

// Secure password rotation route
router.put('/update-forced-password', verifyToken, authController.updateForcedPassword);

module.exports = router;
