const { User, School, Payment, Student, AcademicSession, SchoolSettings, sequelize } = require('../models');
const bcrypt = require('bcryptjs'); // For password hashing (though handled by model hook, good to have for clarity)

/**
 * Registers a new school and its first proprietor user.
 * This operation should be atomic (transactional).
 */
exports.registerSchool = async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    current_session = '2026/2027', 
    current_term = 'First Term' 
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'School name, proprietor email, and password are required.' });
  }

  let transaction;
  try {
    console.log('🔍 REGISTRATION: Starting transaction...');
    transaction = await sequelize.transaction();

    // 1. Create the School entry
    console.log('🔍 REGISTRATION: Creating school with name:', name);
    let newSchool;
    try {
      newSchool = await School.create({
        name: name,
        is_blocked: false, // New schools are not blocked by default
        status: 'active',
        trial_period_days: 30
      }, { transaction });
      console.log('🔍 REGISTRATION: School created with ID:', newSchool.id);
    } catch (error) {
      console.error('🔍 REGISTRATION ERROR - Step 1 (School creation):', error.message);
      throw error;
    }

    // 2. Hash the password manually before creating user
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the first Proprietor User with hashed password
    console.log('🔍 REGISTRATION: Creating user with email:', email, 'for school:', newSchool.id);
    try {
      await User.create({
        school_id: newSchool.id,
        email: email,
        password: hashedPassword,
        role: 'proprietor'
      }, { transaction });
      console.log('🔍 REGISTRATION: User created successfully');
    } catch (error) {
      console.error('🔍 REGISTRATION ERROR - Step 3 (User creation):', error.message);
      throw error;
    }

    // 4. Create academic_sessions entry for the school
    console.log('🔍 REGISTRATION: Creating academic session...');
    try {
      await AcademicSession.create({
        school_id: newSchool.id,
        name: current_session,
        is_current: true
      }, { transaction });
      console.log('🔍 REGISTRATION: Academic session created');
    } catch (error) {
      console.error('🔍 REGISTRATION ERROR - Step 4 (Academic session creation):', error.message);
      console.log('🔍 REGISTRATION: Continuing without academic session...');
      // Don't throw error - allow registration to continue even if session creation fails
    }

    // 5. Create school_settings entry with default values
    console.log('🔍 REGISTRATION: Creating school settings...');
    try {
      await SchoolSettings.create({
        school_id: newSchool.id,
        current_session: current_session,
        current_term: current_term,
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        grading_system: '5.0',
        max_students: null
      }, { transaction });
      console.log('🔍 REGISTRATION: School settings created');
    } catch (error) {
      console.error('🔍 REGISTRATION ERROR - Step 5 (School settings creation):', error.message);
      throw error;
    }

    console.log('🔍 REGISTRATION: Committing transaction...');
    await transaction.commit();
    console.log('🔍 REGISTRATION: Transaction committed successfully');

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
    console.error('REGISTRATION_FLOW_ERROR:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'School name or proprietor email already exists.' });
    }
    res.status(500).json({ 
      message: 'Failed to register school and proprietor.', 
      error: error.message 
    });
  }
};

/**
 * Toggles the `is_blocked` status for a given school.
 */
exports.toggleBlockSchool = async (req, res) => {
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
      include: [{
        model: User,
        as: 'users',
        where: { role: 'proprietor' },
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    const schoolsWithEmail = schools.map(s => {
      const schoolData = s.toJSON();
      schoolData.proprietor_email = schoolData.users?.[0]?.email || null;
      delete schoolData.users;
      return schoolData;
    });

    res.status(200).json({
      message: 'Schools retrieved successfully',
      count: schoolsWithEmail.length,
      schools: schoolsWithEmail
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Failed to retrieve schools.' });
  }
};

/**
 * Get single school details for Super Admin
 */
exports.getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          where: { role: 'proprietor' },
          required: false
        },
        {
          model: SchoolSettings,
          as: 'settings'
        }
      ]
    });

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    const schoolJson = school.toJSON();
    schoolJson.proprietor_email = schoolJson.users?.[0]?.email || null;
    delete schoolJson.users;

    res.status(200).json({
      message: 'School retrieved successfully',
      school: schoolJson,
      settings: schoolJson.settings
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ message: 'Failed to retrieve school.' });
  }
};

/**
 * Update school details (Super Admin only)
 */
exports.updateSchool = async (req, res) => {
  console.log('Updating School ID:', req.params.id);
  console.log('Incoming Form Data:', req.body);

  const { id } = req.params;
  const { 
    name, 
    phone, 
    address, 
    city, 
    state, 
    country, 
    current_session, 
    current_term, 
    is_blocked,
    proprietor_email,
    email
  } = req.body;

  const targetEmail = proprietor_email || email;

  let transaction;
  try {
    transaction = await sequelize.transaction();

    // Raw SQL Update to ensure all fields are persisted directly to the schools table
    const updateSchoolQuery = `
      UPDATE schools 
      SET name = ?, phone = ?, address = ?, city = ?, state = ?, country = ?, 
          current_session = ?, current_term = ?, is_blocked = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      name || null,
      phone || null,
      address || null,
      city || null,
      state || null,
      country || null,
      current_session || null,
      current_term || null,
      is_blocked !== undefined ? (is_blocked ? 1 : 0) : 0,
      id
    ];

    const [result] = await sequelize.query(updateSchoolQuery, {
      replacements: values,
      transaction
    });

    const affectedRows = result && result.affectedRows !== undefined 
      ? result.affectedRows 
      : (result && result.changedRows !== undefined ? result.changedRows : 0);

    if (affectedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'No school found matching that ID.' });
    }

    // Explicitly update proprietor user email if provided
    if (targetEmail) {
      const updateProprietorQuery = `
        UPDATE users 
        SET email = ?, updated_at = NOW() 
        WHERE school_id = ? AND role = 'proprietor'
      `;
      await sequelize.query(updateProprietorQuery, {
        replacements: [targetEmail, id],
        transaction
      });
    }

    await transaction.commit();

    // Fetch the updated school with proprietor user and settings
    const updatedSchool = await School.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          where: { role: 'proprietor' },
          required: false
        },
        {
          model: SchoolSettings,
          as: 'settings'
        }
      ]
    });

    const schoolJson = updatedSchool.toJSON();
    schoolJson.proprietor_email = schoolJson.users?.[0]?.email || null;
    delete schoolJson.users;

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      school: schoolJson
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error updating school:', error);
    res.status(500).json({ success: false, message: 'Failed to update school.', error: error.message });
  }
};

/**
 * Delete school (Super Admin only)
 */
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findByPk(id);

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    await school.destroy();

    res.status(200).json({
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ message: 'Failed to delete school.' });
  }
};

/**
 * Get all academic sessions for Super Admin
 */
exports.getAllSessions = async (req, res) => {
  try {
    console.log('🔍 SESSIONS: Fetching all academic sessions...');
    
    const { sequelize } = require('../models');
    
    // This fetches sessions and joins School name for UI
    const [sessions] = await sequelize.query(`
            SELECT s.*, sch.name as school_name 
            FROM academic_sessions s 
            LEFT JOIN schools sch ON s.school_id = sch.id
            ORDER BY s.created_at DESC
        `);

    console.log('🔍 SESSIONS: Sessions fetched successfully:', sessions.length);
    
    res.status(200).json({
      message: 'Sessions retrieved successfully',
      count: sessions.length,
      sessions: sessions
    });
  } catch (error) {
    console.error('🔍 SESSIONS ERROR: Failed to fetch sessions:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
};

/**
 * Get Super Admin dashboard statistics
 */
exports.getAdminStats = async (req, res) => {
  try {
    console.log('🔍 ADMIN STATS: Starting stats collection...');
    
    const { School, Payment, Student } = require('../models');
    console.log('🔍 ADMIN STATS: Models loaded successfully');

    // Get total schools count (handle empty table)
    console.log('🔍 ADMIN STATS: Querying schools table...');
    const totalSchools = await School.count().catch((err) => {
      console.error('🔍 ADMIN STATS ERROR: Failed to query schools table:', err);
      return 0;
    });
    console.log('🔍 ADMIN STATS: Schools count:', totalSchools);

    // Get total revenue from payments (return 0 if Payment model doesn't exist)
    console.log('🔍 ADMIN STATS: Checking Payment model availability...');
    let totalRevenue = 0;
    if (Payment && typeof Payment.sum === 'function') {
      console.log('🔍 ADMIN STATS: Querying payments table...');
      totalRevenue = await Payment.sum('amount').catch((err) => {
        console.error('🔍 ADMIN STATS ERROR: Failed to query payments table:', err);
        return 0;
      }) || 0;
    } else {
      console.log('🔍 ADMIN STATS: Payment model not available, revenue set to 0');
    }
    console.log('🔍 ADMIN STATS: Total revenue:', totalRevenue);

    // Get total students count (handle empty table)
    console.log('🔍 ADMIN STATS: Querying students table...');
    const totalStudents = await Student.count().catch((err) => {
      console.error('🔍 ADMIN STATS ERROR: Failed to query students table:', err);
      return 0;
    });
    console.log('🔍 ADMIN STATS: Students count:', totalStudents);

    console.log('🔍 ADMIN STATS: Stats collection completed successfully');
    res.status(200).json({
      message: 'Admin statistics retrieved successfully',
      stats: {
        totalSchools,
        totalRevenue,
        totalStudents
      }
    });
  } catch (error) {
    console.error('🔍 ADMIN STATS CRITICAL ERROR:', error);
    console.error('🔍 ADMIN STATS ERROR STACK:', error.stack);
    res.status(500).json({
      message: 'Failed to retrieve statistics',
      error: error.message,
      stack: error.stack
    });
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

/**
 * Get all subscription plans for Super Admin
 */
exports.getPlans = async (req, res) => {
  try {
    console.log('🔍 PLANS: Fetching all subscription plans...');
    
    const { sequelize } = require('../models');
    
    // If table doesn't exist yet, return an empty array gracefully
    const [plans] = await sequelize.query('SELECT * FROM subscription_plans ORDER BY price ASC');
    
    // Parse features for frontend display
    const plansWithParsedFeatures = plans.map(plan => {
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
      } catch (e) {
        console.error('Error parsing features for plan:', plan.id, e);
        parsedFeatures = [];
      }
      return {
        ...plan,
        features: parsedFeatures
      };
    });
    
    console.log('🔍 PLANS: Plans fetched successfully:', plansWithParsedFeatures.length);
    
    res.status(200).json({ 
      success: true, 
      plans: plansWithParsedFeatures 
    });
  } catch (error) {
    console.error('🔍 PLANS ERROR: Failed to fetch plans:', error);
    res.status(200).json({ 
      success: true, 
      plans: [] 
    }); // Return empty array to prevent frontend crash
  }
};

/**
 * Create a new subscription plan (Super Admin only)
 */
exports.createPlan = async (req, res) => {
  try {
    console.log('🔍 PLANS: Creating new subscription plan...');
    
    const { name, price, interval, features } = req.body;

    if (!name || !price || !interval) {
      return res.status(400).json({ 
        message: 'Plan name, price, and interval are required.' 
      });
    }

    // Validate interval options
    const validIntervals = ['monthly', 'yearly', 'termly'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ 
        message: 'Interval must be one of: monthly, yearly, or termly.' 
      });
    }

    const { sequelize } = require('../models');
    
    // TEMPORARY: Drop existing table to fix broken schema
    // TODO: Remove this DROP TABLE line after first successful run to preserve data
    await sequelize.query(`DROP TABLE IF EXISTS subscription_plans`);
    
    // Create fresh table with correct schema
    await sequelize.query(`
      CREATE TABLE subscription_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        \`interval\` VARCHAR(50) NOT NULL DEFAULT 'monthly',
        features LONGTEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert the new plan - use backticks for interval (MySQL reserved keyword)
    const [insertId] = await sequelize.query(`
      INSERT INTO subscription_plans (name, price, \`interval\`, features, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, true, NOW(), NOW())
    `, {
      replacements: [name, parseFloat(price), interval, JSON.stringify(features || [])],
      type: sequelize.QueryTypes.INSERT
    });

    console.log('🔍 PLANS: Plan created successfully');
    
    res.status(201).json({
      message: 'Subscription plan created successfully.',
      plan: {
        id: insertId || 'generated',
        name,
        price: parseFloat(price),
        interval,
        features: features || [],
        is_active: true
      }
    });
  } catch (error) {
    console.error('🔍 PLANS ERROR: Failed to create plan:', error);
    res.status(500).json({ 
      message: 'Failed to create subscription plan.', 
      error: error.message 
    });
  }
};

/**
 * Assign a subscription plan to a school
 */
exports.assignSubscriptionToSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { plan_id, duration_months } = req.body;

    if (!plan_id || !duration_months) {
      return res.status(400).json({ 
        message: 'Plan ID and duration (in months) are required.' 
      });
    }

    const { sequelize } = require('../models');

    // Verify school exists
    const [schools] = await sequelize.query('SELECT * FROM schools WHERE id = ?', {
      replacements: [schoolId]
    });

    if (schools.length === 0) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Verify plan exists
    const [plans] = await sequelize.query('SELECT * FROM subscription_plans WHERE id = ?', {
      replacements: [plan_id]
    });

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    // Calculate expiry date
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(duration_months));

    // Insert school subscription
    await sequelize.query(`
      INSERT INTO school_subscriptions (school_id, plan_id, start_date, expiry_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
    `, {
      replacements: [schoolId, plan_id, startDate, expiryDate]
    });

    // Update school's subscription expiry
    await sequelize.query(`
      UPDATE schools SET subscription_expiry = ?, status = 'active' WHERE id = ?
    `, {
      replacements: [expiryDate, schoolId]
    });

    res.status(201).json({
      message: 'Subscription assigned to school successfully.',
      subscription: {
        school_id: schoolId,
        plan_id,
        start_date: startDate,
        expiry_date: expiryDate,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error assigning subscription:', error);
    res.status(500).json({ 
      message: 'Failed to assign subscription.', 
      error: error.message 
    });
  }
};

/**
 * Get all school subscriptions
 */
exports.getSchoolSubscriptions = async (req, res) => {
  try {
    const { sequelize } = require('../models');

    const [subscriptions] = await sequelize.query(`
      SELECT ss.*, s.name as school_name, sp.name as plan_name, sp.price as plan_price, sp.interval as plan_interval
      FROM school_subscriptions ss
      LEFT JOIN schools s ON ss.school_id = s.id
      LEFT JOIN subscription_plans sp ON ss.plan_id = sp.id
      ORDER BY ss.created_at DESC
    `);

    res.status(200).json({
      message: 'School subscriptions retrieved successfully',
      count: subscriptions.length,
      subscriptions: subscriptions
    });
  } catch (error) {
    console.error('Error fetching school subscriptions:', error);
    res.status(500).json({ message: 'Failed to retrieve school subscriptions.' });
  }
};

/**
 * Delete a subscription plan
 */
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const { sequelize } = require('../models');
    
    await sequelize.query('DELETE FROM subscription_plans WHERE id = ?', {
      replacements: [planId]
    });

    res.status(200).json({
      message: 'Subscription plan deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ message: 'Failed to delete subscription plan.' });
  }
};