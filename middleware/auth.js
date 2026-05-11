const jwt = require('jsonwebtoken');

// Simple JWT verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Incoming Header:', authHeader);
  
  if (!authHeader) {
    console.error('MISSING TOKEN HEADER');
    return res.status(401).json({ 
      message: 'Missing Token Header' 
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.error('MISSING TOKEN IN HEADER');
    return res.status(401).json({ 
      message: 'Missing Token Header' 
    });
  }

  // Check for null/undefined tokens (as strings)
  if (token === 'null' || token === 'undefined' || token === 'null' || token === 'undefined') {
    console.error('INVALID TOKEN FORMAT - null/undefined string');
    return res.status(401).json({ 
      message: 'Invalid token format' 
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('MISSING JWT_SECRET');
    return res.status(500).json({ 
      message: 'Server configuration error - JWT_SECRET missing' 
    });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.error('JWT VERIFICATION FAILED:', err);
      return res.status(401).json({ 
        message: 'Invalid or expired token' 
      });
    }

    req.user = decoded;
    next();
  });
};

module.exports = {
  authenticateToken
};