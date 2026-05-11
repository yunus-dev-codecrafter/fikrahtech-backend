const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('✅ Auth logic synced with bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Raw query fallback to check user existence
    console.log('🔍 DEBUG: Executing raw query for email:', email);
    const [rows] = await sequelize.query('SELECT * FROM users WHERE email = ?', { 
      replacements: [email] 
    });
    console.log('🔍 DEBUG: Raw query result:', rows);

    if (rows.length === 0) {
      return res.status(401).json({ 
        message: 'User not found in database' 
      });
    }

    const user = rows[0];

    // Immediate user existence check to prevent 500 crash
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Use bcrypt.compare to verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Unauthorized' 
      });
    }

    // Strict super_admin role check
    if (user.role !== 'super_admin') {
      return res.status(401).json({ 
        message: 'Unauthorized' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        school_id: user.school_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response with user data and token
    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id
      }
    });
    
  } catch (error) {
    console.error('DETAILED LOGIN ERROR:', error);
    console.error('LOGIN ERROR STACK:', error.stack);
    res.status(500).json({ 
      message: 'Login failed due to server error',
      error: error.message, 
      stack: error.stack 
    });
  }
};