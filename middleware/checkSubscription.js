const { School } = require('../models');

/**
 * Subscription Check Middleware - "The Lockdown"
 * Runs on every request to validate school subscription status
 */
const checkSubscription = async (req, res, next) => {
  try {
    // Skip subscription check for Super Admin and auth routes
    const skipPaths = ['/api/auth/login', '/api/admin'];
    const isSkipPath = skipPaths.some(path => req.path.startsWith(path));
    
    if (isSkipPath) {
      return next();
    }

    // Extract school_id from request (from JWT token, headers, or params)
    let schoolId = null;
    
    // Method 1: From JWT token (if authenticated)
    if (req.user && req.user.schoolId) {
      schoolId = req.user.schoolId;
    }
    // Method 2: From headers (for unauthenticated requests)
    else if (req.headers['x-school-id']) {
      schoolId = req.headers['x-school-id'];
    }
    // Method 3: From URL params
    else if (req.params.schoolId) {
      schoolId = req.params.schoolId;
    }
    // Method 4: From request body
    else if (req.body && req.body.school_id) {
      schoolId = req.body.school_id;
    }

    if (!schoolId) {
      return res.status(400).json({
        message: 'School ID is required',
        debug: 'MISSING_SCHOOL_ID'
      });
    }

    console.log('🔍 SUBSCRIPTION CHECK: Validating school:', schoolId);

    // Find the school
    const school = await School.findByPk(schoolId);
    
    if (!school) {
      return res.status(404).json({
        message: 'School not found',
        debug: 'SCHOOL_NOT_FOUND'
      });
    }

    console.log('📊 SUBSCRIPTION STATUS:', {
      schoolId: school.id,
      status: school.status,
      subscriptionExpiry: school.subscriptionExpiry,
      currentDate: new Date()
    });

    // Check if school is blocked by Super Admin
    if (school.status === 'blocked') {
      console.log('❌ SUBSCRIPTION CHECK: School is BLOCKED');
      return res.status(403).json({
        message: 'Your school has been suspended by the Super Admin.',
        debug: 'SCHOOL_BLOCKED',
        status: school.status
      });
    }

    // Check if subscription has expired
    const currentDate = new Date();
    if (school.subscriptionExpiry && currentDate > school.subscriptionExpiry) {
      console.log('❌ SUBSCRIPTION CHECK: Subscription EXPIRED');
      
      // Auto-update status to expired
      await school.update({ status: 'expired' });
      
      return res.status(403).json({
        message: 'Your subscription has expired. Please contact the proprietor.',
        debug: 'SUBSCRIPTION_EXPIRED',
        status: 'expired',
        expiryDate: school.subscriptionExpiry
      });
    }

    // Check if school is already in expired status
    if (school.status === 'expired') {
      console.log('❌ SUBSCRIPTION CHECK: School status is EXPIRED');
      return res.status(403).json({
        message: 'Your subscription has expired. Please contact the proprietor.',
        debug: 'SCHOOL_EXPIRED',
        status: school.status
      });
    }

    // All checks passed - attach school to request and continue
    req.school = school;
    console.log('✅ SUBSCRIPTION CHECK: PASSED');
    next();

  } catch (error) {
    console.error('❌ SUBSCRIPTION MIDDLEWARE ERROR:', error);
    return res.status(500).json({
      message: 'Error validating subscription',
      debug: 'MIDDLEWARE_ERROR',
      error: error.message
    });
  }
};

module.exports = { checkSubscription };
