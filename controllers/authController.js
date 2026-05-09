const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // DEBUG: Log incoming request
    console.log('🔍 DEBUG: Login request received');
    console.log('📧 Email:', email);
    console.log('🔐 Password provided:', password ? 'YES' : 'NO');

    // 1. Find the user by email
    console.log('🔍 DEBUG: Searching for user with email:', email);
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ DEBUG: User not found in database');
      return res.status(401).json({ 
        message: 'Invalid email or password.',
        debug: 'USER_NOT_FOUND'
      });
    }

    console.log('✅ DEBUG: User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      school_id: user.school_id
    });

    // 2. Check the password (comparing the plain text to the hashed version in DB)
    console.log('🔍 DEBUG: Comparing passwords...');
    console.log('🔍 DEBUG: Input password:', password);
    console.log('🔍 DEBUG: Stored password length:', user.password.length);
    console.log('🔍 DEBUG: Stored password preview:', user.password.substring(0, 20) + '...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 DEBUG: Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ DEBUG: Password comparison failed');
      return res.status(401).json({ 
        message: 'Invalid email or password.',
        debug: 'PASSWORD_MISMATCH'
      });
    }

    console.log('✅ DEBUG: Password match successful');

    // 3. Create a JWT Token (The "VIP Pass")
    console.log('🔍 DEBUG: Creating JWT token...');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.log('❌ DEBUG: JWT_SECRET not found in environment');
      return res.status(500).json({ 
        message: 'Server configuration error.',
        debug: 'JWT_SECRET_MISSING'
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, schoolId: user.school_id },
      jwtSecret,
      { expiresIn: '1d' }
    );

    console.log('✅ DEBUG: JWT token created successfully');

    // 4. Send the success response
    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id
      },
      debug: 'LOGIN_SUCCESS'
    };

    console.log('📤 DEBUG: Sending response:', response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ DEBUG: Login error:', error);
    res.status(500).json({ 
      message: 'An error occurred during login.',
      debug: 'SERVER_ERROR',
      error: error.message
    });
  }
};