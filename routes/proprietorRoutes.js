const express = require('express');
const router = express.Router();
const proprietorController = require('../controllers/proprietorController');
const { authenticateToken } = require('../middleware/auth');

// Role check middleware
const isProprietor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const role = req.user.role.toLowerCase();
  
  if (role === 'proprietor') {
    return next();
  }

  // Gracefully handle other roles (especially super_admin)
  const roleDisplay = role.replace('_', ' ');
  return res.status(403).json({ 
    message: `Access denied. You are logged in as a ${roleDisplay}, but this section requires a Proprietor account.`,
    error: 'ROLE_INSUFFICIENT_PERMISSIONS'
  });
};

// All proprietor routes require authentication and proprietor role
router.use(authenticateToken);
router.use(isProprietor);

// Student & Parent Management
router.get('/students', proprietorController.getAllStudents);
router.post('/students', proprietorController.registerStudent);

// Staff Management
router.get('/staff', proprietorController.getAllStaff);
router.post('/staff', proprietorController.createStaff);

// Classes Management
router.get('/classes', proprietorController.getClasses);
router.post('/classes', proprietorController.createClass);

// Dashboard & Sections
router.get('/dashboard/stats', proprietorController.getDashboardStats);
router.get('/sections', proprietorController.getSections);
router.post('/sections', proprietorController.createSection);

// Reporting
router.get('/reports/academic', proprietorController.getAcademicReport);
router.get('/reports/finance', proprietorController.getFinanceReport);

module.exports = router;
