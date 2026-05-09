const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * JWT Token Verification Middleware
 * Verifies JWT tokens and attaches user to request
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        message: 'Access token required',
        debug: 'NO_TOKEN'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Invalid token format',
        debug: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    if (!decoded) {
      return res.status(401).json({
        message: 'Invalid or expired token',
        debug: 'INVALID_TOKEN'
      });
    }

    // Find user from decoded token
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        debug: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id
    };

    console.log('🔍 TOKEN VERIFIED:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id
    });

    next();
  } catch (error) {
    console.error('❌ TOKEN VERIFICATION ERROR:', error);
    return res.status(500).json({
      message: 'Token verification failed',
      debug: 'VERIFICATION_ERROR',
      error: error.message
    });
  }
};

/**
 * Admin Role Verification Middleware
 * Ensures only Super Admins can access admin routes
 */
const isAdmin = async (req, res, next) => {
  // First verify token
  verifyToken(req, res, () => {
    // Check if user has Super Admin role
    if (req.user && req.user.role !== 'super_admin') {
      console.log('❌ ADMIN ACCESS DENIED:', {
        userId: req.user.id,
        role: req.user.role,
        requiredRole: 'super_admin'
      });
      
      return res.status(403).json({
        message: 'Access denied. Super Admin privileges required.',
        debug: 'INSUFFICIENT_ROLE',
        requiredRole: 'super_admin',
        currentRole: req.user.role
      });
    }

    console.log('✅ ADMIN ACCESS GRANTED:', {
      userId: req.user.id,
      role: req.user.role
    });

    next();
  });
};

module.exports = { verifyToken, isAdmin };
