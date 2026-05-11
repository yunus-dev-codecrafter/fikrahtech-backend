const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

console.log('✅ Auth logic synced with bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use promise pattern to query users table for matching email
    const [users] = await sequelize.query(
      'SELECT id, email, password, role FROM users WHERE email = ?',
      {
        replacements: [email],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Database visibility test - print user data to Render console
    console.log('🔍 DATABASE VISIBILITY TEST - User found:', users[0]);

    // Check if user exists
    if (users.length === 0) {
      return res.status(401).json({ 
        message: 'Unauthorized' 
      });
    }

    const user = users[0];

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
      message: 'Server Error', 
      details: error.message 
    });
  }
};