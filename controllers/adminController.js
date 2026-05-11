const { User, School } = require('../models');
const bcrypt = require('bcryptjs'); // For password hashing (though handled by model hook, good to have for clarity)

/**
 * Registers a new school and its first proprietor user.
 * This operation should be atomic (transactional).
 */
exports.registerSchool = async (req, res) => {
  const { schoolName, proprietorEmail, proprietorPassword } = req.body;

  if (!schoolName || !proprietorEmail || !proprietorPassword) {
    return res.status(400).json({ message: 'School name, proprietor email, and password are required.' });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();

    // 1. Create the School entry
    const newSchool = await School.create({
      name: schoolName,
      is_blocked: false, // New schools are not blocked by default
      // sub_expiry and current_session/term can be set later or with default values
    }, { transaction });

    // 2. Create the first Proprietor User
    // Password hashing is handled by the User model's beforeCreate hook
    await User.create({
      school_id: newSchool.id,
      email: proprietorEmail,
      password: proprietorPassword,
      role: 'proprietor'
    }, { transaction });

    // 3. Create default SchoolSettings entry
    await SchoolSettings.create({
      school_id: newSchool.id,
      currentSession: '2023/2024',
      currentTerm: 'First Term'
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: 'School and proprietor registered successfully.',
      school: {
        id: newSchool.id,
        name: newSchool.name,
        is_blocked: newSchool.is_blocked
      }
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error registering school and proprietor:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'School name or proprietor email already exists.' });
    }
    res.status(500).json({ message: 'Failed to register school and proprietor.' });
  }
};

/**
 * Toggles the `is_blocked` status for a given school.
 */
exports.toggleSchoolBlockStatus = async (req, res) => {
  const { schoolId } = req.params; // Get school ID from URL parameters

  try {
    const school = await School.findByPk(schoolId);

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    school.is_blocked = !school.is_blocked; // Toggle the status
    await school.save();

    res.status(200).json({
      message: `School '${school.name}' block status updated successfully.`,
      school: {
        id: school.id,
        name: school.name,
        is_blocked: school.is_blocked
      }
    });
  } catch (error) {
    console.error('Error toggling school block status:', error);
    res.status(500).json({ message: 'Failed to update school block status.' });
  }
};

/**
 * Adds days to a school's subscription expiry date
 * Super Admin only endpoint
 */
exports.updateSchoolSubscription = async (req, res) => {
  const { schoolId } = req.params;
  const { days, action } = req.body; // days: number, action: 'extend' or 'set'

  if (!days || days <= 0) {
    return res.status(400).json({ 
      message: 'Valid number of days is required.' 
    });
  }

  if (!action || !['extend', 'set'].includes(action)) {
    return res.status(400).json({ 
      message: 'Action must be either "extend" or "set".' 
    });
  }

  try {
    const school = await School.findByPk(schoolId);

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    let newExpiryDate;
    const currentDate = new Date();

    if (action === 'extend') {
      // Extend from current expiry date (or current date if no expiry)
      const baseDate = school.subscriptionExpiry ? new Date(school.subscriptionExpiry) : currentDate;
      newExpiryDate = new Date(baseDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + days);
    } else if (action === 'set') {
      // Set expiry from current date
      newExpiryDate = new Date(currentDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + days);
    }

    // Update school subscription
    await school.update({
      subscriptionExpiry: newExpiryDate,
      status: 'active' // Reset status to active when subscription is updated
    });

    console.log(`📅 SUBSCRIPTION UPDATED: School ${school.name} - ${action} ${days} days - New expiry: ${newExpiryDate}`);

    res.status(200).json({
      message: `School subscription ${action}ed successfully by ${days} days.`,
      school: {
        id: school.id,
        name: school.name,
        status: school.status,
        subscriptionExpiry: school.subscriptionExpiry,
        trialPeriodDays: school.trialPeriodDays
      }
    });
  } catch (error) {
    console.error('Error updating school subscription:', error);
    res.status(500).json({ message: 'Failed to update school subscription.' });
  }
};

/**
 * Get all schools for Super Admin dashboard
 */
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.findAll({
      attributes: [
        'id', 'name', 'status', 'subscriptionExpiry', 
        'current_session', 'current_term', 'trialPeriodDays',
        'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      message: 'Schools retrieved successfully',
      count: schools.length,
      schools: schools
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Failed to retrieve schools.' });
  }
};

/**
 * Get Super Admin dashboard statistics
 */
exports.getAdminStats = async (req, res) => {
  try {
    const { School, Payment, Student } = require('../models');

    // Get total schools count
    const totalSchools = await School.count();

    // Get total revenue from payments (return 0 if null)
    const totalRevenue = await Payment.sum('amount') || 0;

    // Get total students count
    const totalStudents = await Student.count();

    res.status(200).json({
      message: 'Admin statistics retrieved successfully',
      stats: {
        totalSchools,
        totalRevenue,
        totalStudents
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to retrieve statistics.' });
  }
};

/**
 * Get role-specific settings
 */
exports.getSettings = async (req, res) => {
  try {
    const { role } = req.user;

    if (role === 'super_admin') {
      // Super Admin sees System Settings
      res.status(200).json({
        message: 'System settings retrieved successfully',
        settings: {
          type: 'system',
          saasName: 'FikrahTech SaaS Platform',
          maintenanceMode: false,
          version: '1.0.0',
          totalUsers: await User.count(),
          maxSchools: 1000
        }
      });
    } else if (role === 'proprietor') {
      // Proprietor sees School Settings
      const schoolId = req.user.schoolId;
      const school = await School.findByPk(schoolId, {
        include: [{
          model: SchoolSettings,
          as: 'settings'
        }]
      });

      if (!school) {
        return res.status(404).json({ message: 'School not found.' });
      }

      res.status(200).json({
        message: 'School settings retrieved successfully',
        settings: {
          type: 'school',
          schoolName: school.name,
          schoolLogo: school.settings?.schoolLogo || null,
          currentSession: school.settings?.currentSession || '2023/2024',
          currentTerm: school.settings?.currentTerm || 'First Term'
        }
      });
    } else {
      res.status(403).json({
        message: 'Access denied. Invalid role.',
        debug: 'INVALID_ROLE'
      });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to retrieve settings.' });
  }
};

/**
 * Update school settings (Super Admin only)
 */
exports.updateSchoolSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentSession, currentTerm } = req.body;

    if (!currentSession && !currentTerm) {
      return res.status(400).json({
        message: 'At least one of currentSession or currentTerm is required'
      });
    }

    // Find the school
    const school = await School.findByPk(id);
    if (!school) {
      return res.status(404).json({
        message: 'School not found'
      });
    }

    // Find or create school settings
    let settings = await SchoolSettings.findOne({
      where: { school_id: id }
    });

    if (!settings) {
      settings = await SchoolSettings.create({
        school_id: id,
        currentSession: currentSession || '2023/2024',
        currentTerm: currentTerm || 'First Term'
      });
    } else {
      // Update existing settings
      await settings.update({
        currentSession: currentSession || settings.currentSession,
        currentTerm: currentTerm || settings.currentTerm
      });
    }

    res.status(200).json({
      message: 'School settings updated successfully',
      settings: {
        schoolId: id,
        currentSession: settings.currentSession,
        currentTerm: settings.currentTerm
      }
    });
  } catch (error) {
    console.error('Error updating school settings:', error);
    res.status(500).json({ message: 'Failed to update school settings.' });
  }
};