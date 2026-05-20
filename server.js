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
    
    // 1. Temporarily unhook relational constraints
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    try {
      await db.sequelize.query('ALTER TABLE `users` DROP FOREIGN KEY `users_ibfk_1`;');
    } catch (e) {}

    // 2. Clear duplicate accumulated email indexes to resolve ER_TOO_MANY_KEYS
    console.log('🧹 Purging redundant user email indexes...');
    const [indexes] = await db.sequelize.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND INDEX_NAME != 'PRIMARY';
    `);

    // Loop through and drop the accumulated indexes safely
    for (const index of indexes) {
      try {
        // If the index name contains email or numbers from repeated sync tasks, drop it
        if (index.INDEX_NAME.includes('email') || index.INDEX_NAME.includes('users_')) {
          await db.sequelize.query(`ALTER TABLE \`users\` DROP INDEX \`${index.INDEX_NAME}\`;`);
        }
      } catch (err) {
        // Ignore if already gone
      }
    }

    // 3. Re-apply the column alignment constraint safely
    await db.sequelize.query('ALTER TABLE `users` MODIFY COLUMN `school_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;');
    
    // 4. Re-enable foreign key constraints
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Native constraints unlinked, indexes purged, and school_id successfully altered.');
  } catch (migrationError) {
    console.error('⚠️ Migration failure:', migrationError.message);
  }
  
  // 5. Ensure subscription_plans table exists
  console.log('🔄 Verifying subscription_plans table...');
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        billing_cycle ENUM('monthly', 'termly', 'session') NOT NULL DEFAULT 'monthly',
        discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        features TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX(is_active)
      )
    `);
    console.log('✅ subscription_plans table verified/created');
  } catch (err) {
    console.error('⚠️ Error creating subscription_plans table:', err.message);
  }

  // 6. Patch missing columns on existing subscription_plans table
  console.log('🔄 Checking and patching subscription_plans columns...');
  try {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    try {
      await db.sequelize.query(`
        ALTER TABLE \`subscription_plans\`
        ADD COLUMN \`billing_cycle\` ENUM('monthly', 'termly', 'session') DEFAULT 'termly' AFTER \`price\`;
      `);
      console.log('✅ Successfully added billing_cycle column to subscription_plans.');
    } catch (err) {
      console.log('ℹ️ billing_cycle column check processed.');
    }

    try {
      await db.sequelize.query(`
        ALTER TABLE \`subscription_plans\`
        ADD COLUMN \`discount_amount\` DECIMAL(10,2) DEFAULT 0.00 AFTER \`billing_cycle\`;
      `);
      console.log('✅ Successfully added discount_amount column to subscription_plans.');
    } catch (err) {
      console.log('ℹ️ discount_amount column check processed.');
    }

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  } catch (error) {
    console.error('⚠️ Plan schema patch error:', error.message);
  }

  // 7. Ensure school_plans table exists
  console.log('🔄 Verifying school_plans table...');
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plan_id INT NOT NULL,
        school_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_plan_school (plan_id, school_id),
        INDEX(school_id),
        INDEX(plan_id),
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    console.log('✅ school_plans table verified/created');
  } catch (err) {
    console.error('⚠️ Error creating school_plans table:', err.message);
  }
  
  return db.sequelize.sync();
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
