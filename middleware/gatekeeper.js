const { School } = require('../models'); // Assuming School model is available

/**
 * Gatekeeper middleware to check school status (blocked, subscription expiry).
 * Requires school_id to be present in req.schoolId (e.g., from an auth middleware or header).
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const gatekeeper = async (req, res, next) => {
  // In a real application, schoolId would likely come from a JWT payload
  // after an authentication middleware has run, or from a specific header.
  // For Phase Zero, let's assume it's set on req.schoolId or from a header for testing.
  const schoolId = req.schoolId || req.headers['x-school-id']; // Example: get from header

  if (!schoolId) {
    return res.status(400).json({ message: 'School ID is required.' });
  }

  try {
    const school = await School.findByPk(schoolId);

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    if (school.is_blocked) {
      return res.status(403).json({ message: 'Access forbidden. This school is blocked.' });
    }

    const now = new Date();
    if (school.sub_expiry && new Date(school.sub_expiry) < now) {
      return res.status(402).json({ message: 'Payment required. School subscription has expired.' });
    }

    // Attach school object to request for further use in controllers
    req.school = school;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Gatekeeper middleware error:', error);
    return res.status(500).json({ message: 'Internal server error during school validation.' });
  }
};

module.exports = gatekeeper;
