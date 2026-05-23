const express = require('express');
const router = express.Router();
const proprietorController = require('../controllers/proprietorController');
const { authenticateToken } = require('../middleware/auth');

// Role check middleware
const isProprietor = (req, res, next) => {
  if (req.user && req.user.role.toLowerCase() === 'proprietor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Proprietor role required.' });
  }
};

// All proprietor routes require authentication and proprietor role
router.use(authenticateToken);
router.use(isProprietor);

// Student & Parent Management
router.post('/students/register', proprietorController.registerStudent);

// Dashboard & Sections
router.get('/dashboard/stats', proprietorController.getDashboardStats);
router.get('/sections', proprietorController.getSections);
router.post('/sections', proprietorController.createSection);

// Reporting
router.get('/reports/academic', proprietorController.getAcademicReport);
router.get('/reports/finance', proprietorController.getFinanceReport);

module.exports = router;
