const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const schoolController = require('../controllers/schoolController');

// Apply authentication middleware to all school routes
router.use(verifyToken);

// Route for Proprietor to get school profile
router.get('/profile', schoolController.getSchoolProfile);

// Route for public school information (Staff/Parents)
router.get('/:schoolId/public-info', schoolController.getPublicSchoolInfo);

module.exports = router;
