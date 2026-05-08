require('dotenv').config();
const app = require('./app');
const db = require('./models'); // Import the Sequelize instance
const bcrypt = require('bcryptjs');

async function emergencySetup() {
    try {
        const email = 'yunusabdulhameed1@gmail.com';
        const plainPassword = 'Yunus081@';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // This checks if the user exists. If yes, it updates. If no, it creates.
        const existingUser = await db.User.findOne({ where: { email } });
        
        if (existingUser) {
            await existingUser.update({ password: hashedPassword, role: 'super_admin' });
            console.log('✅ SUPER ADMIN UPDATED SUCCESSFULLY');
        } else {
            await db.User.create({
                email: email,
                password: hashedPassword,
                role: 'super_admin',
                school_id: null // Super admin might not have a school_id initially
            });
            console.log('✅ NEW SUPER ADMIN CREATED SUCCESSFULLY');
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
