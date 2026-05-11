const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

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

    // Success: Return user's ID and Role
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('DETAILED LOGIN ERROR:', error);
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
};