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