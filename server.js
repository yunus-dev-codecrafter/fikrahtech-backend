require('dotenv').config();
const app = require('./app');
const db = require('./models'); // Import the Sequelize instance
const { bootstrapSystem } = require('./utils/bootstrap');

// Check JWT_SECRET status
if (process.env.JWT_SECRET) {
  console.log('✅ KEY FOUND: JWT_SECRET is configured');
} else {
  console.log('❌ KEY MISSING: JWT_SECRET is not configured');
}

const PORT = process.env.PORT || 3000;

// Sync Sequelize models with database
db.sequelize.sync({ alter: true }) // Use alter: true to update schema without dropping data
  .then(async () => {
    console.log('Database synced successfully.');
    
    // Log total users count on startup for database verification
    const { User } = db;
    const userCount = await User.count();
    console.log('TOTAL USERS IN DB:', userCount);
    
    // Run system bootstrap after database sync
    const bootstrapResult = await bootstrapSystem();
    
    if (bootstrapResult.success) {
      console.log(' FikrahTech is ready for operation!');
    } else {
      console.log(' Server starting with bootstrap warnings...');
    }
    
    // Global error handler middleware
    app.use((err, req, res, next) => {
      console.error('CRITICAL SERVER ERROR:', err);
      res.status(500).json({ 
        error: err.message, 
        stack: err.stack 
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });
