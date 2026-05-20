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
const syncDatabase = async () => {
  try {
    console.log('🔄 Running safe native schema migration overrides...');
    
    // Disable checks to allow raw changes
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Drop the constraint using standard SQL syntax. Wrapped in try/catch to ignore if it doesn't exist
    try {
      await db.sequelize.query('ALTER TABLE `users` DROP FOREIGN KEY `users_ibfk_1`;');
    } catch (err) {
      console.log('ℹ️ Constraint users_ibfk_1 already dropped or not found.');
    }

    // Force alter the underlying database storage row to accept null states natively
    await db.sequelize.query('ALTER TABLE `users` MODIFY COLUMN `school_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;');
    
    // Re-enable relational safety parameters
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Native constraints unlinked and school_id successfully altered.');
  } catch (migrationError) {
    console.error('⚠️ Migration failure:', migrationError.message);
  }
  
  return db.sequelize.sync({ alter: true });
};

syncDatabase()
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
