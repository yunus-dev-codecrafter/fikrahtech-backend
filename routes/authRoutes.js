const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// The route for logging in
router.post('/login', authController.login);

module.exports = router;
