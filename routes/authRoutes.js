const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// This defines the /login part of the URL
router.post('/login', authController.login);

module.exports = router;
