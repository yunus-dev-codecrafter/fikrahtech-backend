const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

console.log('✅ Auth logic synced with bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Case-insensitive email comparison
    console.log('🔍 DEBUG: Executing case-insensitive query for email:', email.toLowerCase());
    const [users] = await sequelize.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      {
        replacements: [email],
        type: sequelize.QueryTypes.SELECT
      }
    );
    console.log('🔍 DEBUG: Raw SQL query result:', users);

    // Database visibility test - print user data to Render console
    console.log('🔍 DATABASE VISIBILITY TEST - User found:', users[0]);

    // Check if user exists
    if (users.length === 0) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];

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