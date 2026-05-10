const { School, SchoolSettings } = require('../models');

/**
 * Get school profile for authenticated Proprietor
 */
exports.getSchoolProfile = async (req, res) => {
  try {
    // Get school ID from authenticated user
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({
        message: 'Authentication required',
        debug: 'NO_SCHOOL_ID'
      });
    }

    const schoolId = req.user.schoolId;

    // Find school with settings
    const school = await School.findByPk(schoolId, {
      include: [{
        model: SchoolSettings,
        as: 'settings'
      }]
    });

    if (!school) {
      return res.status(404).json({
        message: 'School not found',
        debug: 'SCHOOL_NOT_FOUND'
      });
    }

    // Get school settings (or create default if not exists)
    const settings = school.settings || await SchoolSettings.create({
      school_id: schoolId,
      currentSession: '2023/2024',
      currentTerm: 'First Term'
    });

    res.status(200).json({
      message: 'School profile retrieved successfully',
      school: {
        id: school.id,
        name: school.name,
        status: school.status,
        subscriptionExpiry: school.subscriptionExpiry,
        trialPeriodDays: school.trialPeriodDays,
        settings: {
          currentSession: settings.currentSession,
          currentTerm: settings.currentTerm
        }
      }
    });
  } catch (error) {
    console.error('Error fetching school profile:', error);
    res.status(500).json({
      message: 'Failed to retrieve school profile',
      debug: 'FETCH_ERROR',
      error: error.message
    });
  }
};

/**
 * Get public school information (Staff/Parents access)
 */
exports.getPublicSchoolInfo = async (req, res) => {
  try {
    const { schoolId } = req.params;

    if (!schoolId) {
      return res.status(400).json({
        message: 'School ID is required',
        debug: 'MISSING_SCHOOL_ID'
      });
    }

    // Find school with settings
    const school = await School.findByPk(schoolId, {
      include: [{
        model: SchoolSettings,
        as: 'settings'
      }]
    });

    if (!school) {
      return res.status(404).json({
        message: 'School not found',
        debug: 'SCHOOL_NOT_FOUND'
      });
    }

    // Get school settings (or create default if not exists)
    const settings = school.settings || await SchoolSettings.create({
      school_id: schoolId,
      currentSession: '2023/2024',
      currentTerm: 'First Term'
    });

    res.status(200).json({
      message: 'Public school information retrieved successfully',
      school: {
        id: school.id,
        name: school.name,
        status: school.status,
        // Privacy: Only show Session/Term, NOT subscription expiry
        settings: {
          currentSession: settings.currentSession,
          currentTerm: settings.currentTerm
        }
      }
    });
  } catch (error) {
    console.error('Error fetching public school info:', error);
    res.status(500).json({
      message: 'Failed to retrieve school information',
      debug: 'FETCH_ERROR',
      error: error.message
    });
  }
};
