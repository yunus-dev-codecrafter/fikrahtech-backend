require('dotenv').config();
const app = require('./app');
const db = require('./models'); // Import the Sequelize instance
const bcrypt = require('bcryptjs');

async function emergencySetup() {
    try {
        const email = 'yunusabdulhameed1@gmail.com';
        const plainPassword = 'Yunus081@';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Check if user exists
        const user = await db.User.findOne({ where: { email } });
        
        if (user) {
            // If user exists, just update the password
            await user.update({ password: hashedPassword, role: 'superadmin' });
            console.log('✅ SUPER ADMIN PASSWORD UPDATED');
        } else {
            // If creating NEW, we MUST provide a school_id (using 1 as a placeholder)
            await db.User.create({ 
                email, 
                password: hashedPassword, 
                role: 'superadmin',
                school_id: 1 // Adding this to satisfy the database rule!
            });
            console.log('✅ NEW SUPER ADMIN CREATED WITH SCHOOL_ID 1');
        }
    } catch (err) {
        console.error('❌ Emergency Setup Failed:', err);
    }
}

const PORT = process.env.PORT || 3000;

// Sync Sequelize models with the database
db.sequelize.sync() // Use { force: true } for development to drop and recreate tables
  .then(async () => {
    console.log('Database synced successfully.');
    
    // Run emergency setup after database sync
    await emergencySetup();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });
