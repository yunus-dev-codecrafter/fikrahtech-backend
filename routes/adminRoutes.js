const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route for Super Admin to register a new school and its first proprietor
router.post('/schools/register', adminController.registerSchool);

// Route for Super Admin to toggle the blocked status of a school
router.put('/schools/:schoolId/toggle-block', adminController.toggleSchoolBlockStatus);

// Route for Super Admin to manage school subscriptions
router.put('/schools/:schoolId/subscription', adminController.updateSchoolSubscription);

// Route for Super Admin to get list of schools
router.get('/schools', adminController.getAllSchools);

module.exports = router;