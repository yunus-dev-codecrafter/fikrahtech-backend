const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/verifyToken');

// Apply authentication middleware to all admin routes
router.use(verifyToken);

// Route for Super Admin to register a new school and its first proprietor
router.post('/schools/register', adminController.registerSchool);

// Route for Super Admin to toggle the blocked status of a school
router.put('/schools/:schoolId/toggle-block', adminController.toggleSchoolBlockStatus);

// Route for Super Admin to manage school subscriptions
router.put('/schools/:schoolId/subscription', adminController.updateSchoolSubscription);

// Route for Super Admin to get list of schools
router.get('/schools', adminController.getAllSchools);

// Route for Super Admin to get dashboard statistics
router.get('/stats', adminController.getAdminStats);

// Route for role-specific settings
router.get('/settings', adminController.getSettings);

// Route for Super Admin to update school settings
router.put('/schools/:id/settings', adminController.updateSchoolSettings);

module.exports = router;