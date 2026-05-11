const jwt = require('jsonwebtoken');

// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: 'Access token required' 
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set');
    return res.status(500).json({ 
      message: 'Server configuration error' 
    });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(401).json({ 
        message: 'Invalid or expired token' 
      });
    }

    req.user = decoded;
    next();
  });
};

// Role verification middleware
const verifyRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Insufficient permissions' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  verifyRole
};