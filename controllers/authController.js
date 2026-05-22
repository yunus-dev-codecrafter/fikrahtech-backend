const { sequelize, User } = require('../models');
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

    // Check school status for non-super_admin users
    if (user.role !== 'super_admin' && user.school_id) {
      const [schools] = await sequelize.query('SELECT * FROM schools WHERE id = ?', {
        replacements: [user.school_id]
      });

      if (schools.length === 0) {
        return res.status(401).json({
          message: 'School not found'
        });
      }

      const school = schools[0];

      // Check if school is blocked
      if (school.is_blocked) {
        return res.status(403).json({
          message: 'Your school has been blocked. Please contact the administrator.',
          error: 'SCHOOL_BLOCKED'
        });
      }

      // Check if subscription has expired
      if (school.subscription_expiry) {
        const currentDate = new Date();
        const expiryDate = new Date(school.subscription_expiry);

        if (currentDate > expiryDate) {
          return res.status(403).json({
            message: 'Your subscription has expired. Please renew to continue.',
            error: 'SUBSCRIPTION_EXPIRED',
            expiry_date: school.subscription_expiry
          });
        }
      }
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
        school_id: user.school_id,
        needs_password_reset: !!user.needs_password_reset
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

exports.updateForcedPassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update password and toggle needs_password_reset back to false
    // User model hooks will hash the password
    user.password = newPassword;
    user.needs_password_reset = false;
    await user.save();

    console.log(`🔍 PASSWORD ROTATION: User ${user.email} rotated their password successfully.`);

    return res.status(200).json({
      message: 'Password updated successfully.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        needs_password_reset: false
      }
    });
  } catch (error) {
    console.error('Error updating forced password:', error);
    return res.status(500).json({ 
      message: 'Failed to update password due to server error.', 
      error: error.message 
    });
  }
};