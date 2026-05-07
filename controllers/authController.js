const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 2. Check the password (comparing the plain text to the hashed version in DB)
    // Note: If you haven't set up bcrypt in your model hooks yet, 
    // you might need a direct comparison for now, but let's assume standard hashing.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 3. Create the JWT Token (The "VIP Pass")
    const token = jwt.sign(
      { id: user.id, role: user.role, schoolId: user.school_id },
      process.env.JWT_SECRET || 'your_secret_key', // Ensure JWT_SECRET is in your .env
      { expiresIn: '1d' }
    );

    // 4. Send the success response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};