require('dotenv').config();
const app = require('./app');
const db = require('./models'); // Import the Sequelize instance
const bcrypt = require('bcryptjs');

async function emergencySetup() {
    try {
        const email = 'yunusabdulhameed1@gmail.com';
        const plainPassword = 'Yunus081@';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // 1. Ensure a School exists first
        // Replace 'School' with whatever your School model is named
        const [school] = await db.School.findOrCreate({
            where: { id: 1 },
            defaults: { name: 'FikrahTech Main Academy' }
        });
        console.log('✅ SCHOOL CHECK COMPLETE');

        // 2. Now handle the Super Admin
        const [user, created] = await db.User.findOrCreate({
            where: { email: email },
            defaults: {
                password: hashedPassword,
                role: 'superadmin',
                school_id: 1
            }
        });

        if (!created) {
            await user.update({ password: hashedPassword, role: 'superadmin', school_id: 1 });
            console.log('✅ SUPER ADMIN UPDATED');
        } else {
            console.log('✅ NEW SUPER ADMIN CREATED');
        }

    } catch (err) {
        console.error('❌ FINAL EMERGENCY FAIL:', err);
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
