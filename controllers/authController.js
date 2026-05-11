const { sequelize } = require('../models');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use promise pattern to query users table for matching email
    const [users] = await sequelize.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      {
        replacements: [email],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Check if user exists
    if (users.length === 0) {
      return res.status(401).json({ 
        message: 'Invalid Credentials' 
      });
    }

    const user = users[0];

    // Plain text password comparison
    if (password !== user.password) {
      return res.status(401).json({ 
        message: 'Invalid Credentials' 
      });
    }

    // Check if role is 'super_admin'
    if (user.role !== 'super_admin') {
      return res.status(401).json({ 
        message: 'Invalid Credentials' 
      });
    }

    // Success: Return user's ID, Name, and Role
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login' 
    });
  }
};