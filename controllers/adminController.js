const { User, School, Payment, Student, AcademicSession, SchoolSettings, SubscriptionPlan, SchoolPlan, sequelize } = require('../models');
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
    const [schools] = await sequelize.query(`
      SELECT
        s.*,
        u.email AS proprietor_email,
        u.id AS proprietor_id,
        ss.start_date,
        ss.expiry_date,
        sp.name  AS plan_name,
        sp.price AS plan_price
      FROM schools s
      LEFT JOIN users u
        ON u.school_id = s.id AND u.role = 'proprietor'
      LEFT JOIN school_subscriptions ss
        ON ss.school_id = s.id
      LEFT JOIN subscription_plans sp
        ON sp.id = ss.plan_id
      ORDER BY s.created_at DESC
    `);

    res.status(200).json({
      message: 'Schools retrieved successfully',
      count: schools.length,
      schools
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
    schoolJson.proprietor_id = schoolJson.users?.[0]?.id || null;
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

    // PostgreSQL returns rowCount, MySQL returns affectedRows
    const affectedRows = result?.rowCount ?? result?.affectedRows ?? 0;

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

exports.getAllSessions = async (req, res) => {
  try {
    console.log('🔍 SESSIONS: Fetching school session overview...');

    // 1. Fetch sessions including the School model with a left join (required: false)
    const sessionRecords = await AcademicSession.findAll({
      include: [
        {
          model: School,
          as: 'school',
          required: false // 👈 CRITICAL: Prevents breaking if user has no school (super_admin)
        }
      ]
    });

    // 2. Secure the response mapping loop using optional chaining (?.) and safe fallbacks
    const sessions = sessionRecords.map(session => ({
      school_id: session.school?.id || session.school_id || null,
      school_name: session.school?.name || 'System / Platform Wide',
      status: session.school?.status || 'Inactive',
      current_session_name: session.name || 'Not Started',
      current_term_name: session.school?.current_term || 'Not Set',
      current_session: session.name || 'Not Started',
      current_term: session.school?.current_term || 'Not Set',
      active_session_record: session.name || null,
      active_session_id: session.id || null
    }));

    console.log('🔍 SESSIONS: Fetched successfully:', sessions.length, 'sessions');

    res.status(200).json({
      message: 'Sessions retrieved successfully',
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('🔍 SESSIONS ERROR: Failed to fetch sessions:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
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
    const plans = await SubscriptionPlan.findAll({ order: [['price', 'ASC']] });
    
    const plansWithParsedFeatures = plans.map(plan => {
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
      } catch (e) {
        console.error('Error parsing features for plan:', plan.id, e);
        parsedFeatures = [];
      }
      return {
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        billing_cycle: plan.billing_cycle,
        discount_amount: parseFloat(plan.discount_amount),
        features: parsedFeatures,
        is_active: plan.is_active,
        created_at: plan.created_at,
        updated_at: plan.updated_at
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
  const transaction = await sequelize.transaction();
  try {
    console.log('🔍 PLANS: Creating new subscription plan inside transaction...');
    
    // 1. Destructure the updated structural data payload from frontend
    const { 
      name, 
      price, 
      interval, 
      billing_cycle, 
      discount_amount, 
      features, 
      schoolIds, 
      startDate, 
      endDate 
    } = req.body;

    const cycle = billing_cycle || interval;

    if (!name || price === undefined || !cycle) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Plan name, price, and billing cycle (or interval) are required.' 
      });
    }

    // Validate cycle/interval options and map to valid billing cycles ('monthly', 'termly', 'session')
    let mappedCycle = cycle.toLowerCase();
    if (mappedCycle === 'yearly') {
      mappedCycle = 'session';
    }

    const validCycles = ['monthly', 'termly', 'session'];
    if (!validCycles.includes(mappedCycle)) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Billing cycle must be one of: monthly, termly, or session.' 
      });
    }

    // If schoolIds are provided, validate timeline bounds (start_date, end_date)
    if (schoolIds && Array.isArray(schoolIds) && schoolIds.length > 0) {
      if (!startDate || !endDate) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Both start date and end date are required when associating schools.'
        });
      }
    }

    // 2. Build the base architectural plan entity
    const plan = await SubscriptionPlan.create({
      name,
      price: parseFloat(price),
      billing_cycle: mappedCycle,
      discount_amount: discount_amount ? parseFloat(discount_amount) : 0.00,
      features: features ? (typeof features === 'string' ? features : JSON.stringify(features)) : '[]',
      is_active: true
    }, { transaction });

    // 3. Process the explicit school mappings if provided
    if (schoolIds && Array.isArray(schoolIds) && schoolIds.length > 0) {
      const linkages = schoolIds.map(schoolId => ({
        plan_id: plan.id,
        school_id: schoolId,
        start_date: startDate,
        end_date: endDate
      }));

      await SchoolPlan.bulkCreate(linkages, { transaction });
    }

    await transaction.commit();
    console.log('🔍 PLANS: Plan and associated school mappings created successfully with ID:', plan.id);
    
    // Parse features if they are stringified
    let parsedFeatures = [];
    if (features) {
      parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
    }

    return res.status(201).json({
      message: 'Subscription plan created successfully.',
      plan: {
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        billing_cycle: plan.billing_cycle,
        discount_amount: parseFloat(plan.discount_amount),
        features: parsedFeatures,
        is_active: plan.is_active
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error in plan creation controller:', error);
    return res.status(500).json({ 
      message: 'Failed to create subscription plan alignment.',
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
    const { planId, plan_id, startDate, start_date, expiryDate, expiry_date } = req.body;

    const final_plan_id = planId || plan_id;
    const final_start_date = startDate || start_date;
    const final_expiry_date = expiryDate || expiry_date;

    if (!final_plan_id) {
      return res.status(400).json({ message: 'Plan ID (planId or plan_id) is required.' });
    }
    if (!final_start_date) {
      return res.status(400).json({ message: 'Start date (startDate or start_date) is required.' });
    }
    if (!final_expiry_date) {
      return res.status(400).json({ message: 'Expiry date (expiryDate or expiry_date) is required.' });
    }

    const { sequelize } = require('../models');

    // Ensure the school_subscriptions junction table is safely initialized (PostgreSQL syntax):
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_subscriptions (
          id SERIAL PRIMARY KEY,
          school_id VARCHAR(255) NOT NULL,
          plan_id INT NOT NULL,
          start_date DATE NOT NULL,
          expiry_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verify school exists
    const [schools] = await sequelize.query('SELECT * FROM schools WHERE id = ?', {
      replacements: [schoolId]
    });

    if (schools.length === 0) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Verify plan exists
    const [plans] = await sequelize.query('SELECT * FROM subscription_plans WHERE id = ?', {
      replacements: [final_plan_id]
    });

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    // Implement upsert mechanism
    const [existing] = await sequelize.query('SELECT * FROM school_subscriptions WHERE school_id = ?', {
      replacements: [schoolId]
    });

    if (existing.length > 0) {
      await sequelize.query(`
        UPDATE school_subscriptions 
        SET plan_id = ?, start_date = ?, expiry_date = ?, updated_at = NOW()
        WHERE school_id = ?
      `, {
        replacements: [final_plan_id, final_start_date, final_expiry_date, schoolId]
      });
    } else {
      await sequelize.query(`
        INSERT INTO school_subscriptions (school_id, plan_id, start_date, expiry_date, updated_at)
        VALUES (?, ?, ?, ?, NOW())
      `, {
        replacements: [schoolId, final_plan_id, final_start_date, final_expiry_date]
      });
    }

    // Update school's subscription expiry
    await sequelize.query(`
      UPDATE schools SET subscription_expiry = ?, status = 'active' WHERE id = ?
    `, {
      replacements: [final_expiry_date, schoolId]
    });

    res.status(201).json({
      message: 'Subscription assigned to school successfully.',
      subscription: {
        school_id: schoolId,
        plan_id: final_plan_id,
        start_date: final_start_date,
        expiry_date: final_expiry_date,
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
      SELECT ss.*, s.name as school_name, sp.name as plan_name, sp.price as plan_price, sp.billing_cycle as plan_interval
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
 * Update a subscription plan (Super Admin only)
 */
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, billing_cycle, interval, discount_amount, features } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    
    if (price !== undefined) {
      updateData.price = price !== null ? parseFloat(price) : 0.00;
    }

    const cycle = billing_cycle || interval;
    if (cycle !== undefined) {
      let mappedCycle = cycle.toLowerCase();
      if (mappedCycle === 'yearly') {
        mappedCycle = 'session';
      }
      const validCycles = ['monthly', 'termly', 'session'];
      if (!validCycles.includes(mappedCycle)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Billing cycle must be one of: monthly, termly, or session.' 
        });
      }
      updateData.billing_cycle = mappedCycle;
    }

    if (discount_amount !== undefined) {
      updateData.discount_amount = discount_amount !== null ? parseFloat(discount_amount) : 0.00;
    }

    if (features !== undefined) {
      let finalFeatures = '[]';
      if (features === null || features === '') {
        finalFeatures = '[]';
      } else if (typeof features === 'string') {
        try {
          const parsed = JSON.parse(features);
          finalFeatures = typeof parsed === 'string' ? JSON.stringify([parsed]) : JSON.stringify(parsed);
        } catch (e) {
          finalFeatures = JSON.stringify([features]);
        }
      } else if (Array.isArray(features)) {
        finalFeatures = JSON.stringify(features);
      } else {
        finalFeatures = JSON.stringify([features]);
      }
      updateData.features = finalFeatures;
    }

    console.log('🔄 PLANS: Updating subscription plan', id, 'with details:', updateData);
    await plan.update(updateData);

    // Prepare clean response object with parsed features
    let parsedFeaturesResponse = [];
    try {
      parsedFeaturesResponse = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
    } catch (e) {
      parsedFeaturesResponse = [];
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        billing_cycle: plan.billing_cycle,
        discount_amount: parseFloat(plan.discount_amount),
        features: parsedFeaturesResponse,
        is_active: plan.is_active,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a subscription plan (Super Admin only)
 */
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    await plan.destroy();
    return res.status(200).json({ success: true, message: 'Plan removed successfully' });
  } catch (error) {
    console.error('❌ Error deleting plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Reset User Password to a temporary fallback password and force rotation (Super Admin only)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate a human-readable temporary password: FikrahTemp! + 4 random digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `FikrahTemp!${randomDigits}`;

    // Update targeted user's password and needs_password_reset
    // User model hooks will hash it
    user.password = tempPassword;
    user.needs_password_reset = true;
    await user.save();

    console.log(`🔍 ADMIN OVERRIDE: Reset password for user ${user.email} to temporary password: ${tempPassword}`);

    return res.status(200).json({
      message: 'Password reset successfully.',
      temporaryPassword: tempPassword
    });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return res.status(500).json({ message: 'Failed to reset password due to server error.', error: error.message });
  }
};