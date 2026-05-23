const { 
  User, 
  Student, 
  StudentParent, 
  Staff, 
  Section, 
  Class, 
  AcademicTerm, 
  sequelize 
} = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Helper to get section_id from request
 */
const getSectionId = (req) => {
  return req.headers['x-section-id'] || req.query.section_id;
};

/**
 * Register a new student and associate with a parent
 */
exports.registerStudent = async (req, res) => {
  const { 
    first_name, 
    last_name, 
    admission_number, 
    class_id, 
    section_id, 
    profile_data,
    parent_email,
    parent_name,
    parent_phone
  } = req.body;

  const school_id = req.user.school_id;
  const active_section_id = section_id || getSectionId(req);

  if (!first_name || !last_name || !parent_email) {
    return res.status(400).json({ message: 'First name, last name, and parent email are required.' });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();

    // 1. Check if parent exists
    let parent = await User.findOne({ where: { email: parent_email }, transaction });

    if (!parent) {
      // Create new parent user
      const tempPassword = await bcrypt.hash('parent123', 10); // Default password
      parent = await User.create({
        email: parent_email,
        name: parent_name || 'Parent',
        password: 'parent123', // Model hook will hash this if we pass plain text
        role: 'parent',
        school_id: school_id,
        status: 'active'
      }, { transaction });
    }

    // 2. Create student
    const student = await Student.create({
      first_name,
      last_name,
      admission_number,
      school_id,
      class_id,
      section_id: active_section_id,
      profile_data: profile_data || {}
    }, { transaction });

    // 3. Link student and parent
    await StudentParent.create({
      student_id: student.id,
      parent_id: parent.id
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: 'Student and parent registered successfully',
      student,
      parent_id: parent.id
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error registering student:', error);
    res.status(500).json({ message: 'Failed to register student.', error: error.message });
  }
};

/**
 * Get dashboard statistics filtered by section
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const section_id = getSectionId(req);

    const whereClause = { school_id };
    if (section_id) {
      whereClause.section_id = section_id;
    }

    const studentCount = await Student.count({ where: whereClause });
    
    // Additional stats can be added here
    
    res.status(200).json({
      message: 'Dashboard stats retrieved',
      stats: {
        total_students: studentCount,
        active_section: section_id || 'All'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to retrieve stats.' });
  }
};

/**
 * Academic Reports Stub
 */
exports.getAcademicReport = async (req, res) => {
  try {
    const section_id = getSectionId(req);
    // Stub logic for academic report summarizing headmaster submissions
    res.status(200).json({
      message: 'Academic report retrieved successfully',
      section_id: section_id || 'All',
      data: {
        summary: 'Academic performance summary stub',
        submissions: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve academic report.' });
  }
};

/**
 * Finance Reports Stub
 */
exports.getFinanceReport = async (req, res) => {
  try {
    const section_id = getSectionId(req);
    // Stub logic for finance report summarizing cashier collection metrics
    res.status(200).json({
      message: 'Finance report retrieved successfully',
      section_id: section_id || 'All',
      data: {
        total_collected: 0,
        pending_fees: 0,
        metrics: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve finance report.' });
  }
};

/**
 * Get Sections for the school
 */
exports.getSections = async (req, res) => {
  try {
    const sections = await Section.findAll({
      where: { school_id: req.user.school_id }
    });
    res.status(200).json({ sections });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sections.' });
  }
};

/**
 * Create Section
 */
exports.createSection = async (req, res) => {
  try {
    const { name } = req.body;
    const section = await Section.create({
      name,
      school_id: req.user.school_id
    });
    res.status(201).json({ section });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create section.' });
  }
};
