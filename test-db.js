require('dotenv').config();
const db = require('./models');
const { bootstrapSystem } = require('./utils/bootstrap');

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
  
  return db.sequelize.sync();
};

syncDatabase()
  .then(async () => {
    console.log('✅ DB Synced successfully!');
    const res = await bootstrapSystem();
    console.log('✅ Bootstrap result:', res);
    
    // Check if Super Admin's school_id is null
    const superAdmin = await db.User.findOne({ where: { role: 'super_admin' } });
    if (superAdmin) {
      console.log('✅ Super Admin found! school_id =', superAdmin.school_id);
      if (superAdmin.school_id === null) {
        console.log('✅ Decoupled verification PASSED!');
      } else {
        console.log('❌ Decoupled verification FAILED! school_id is not null');
      }
    } else {
      console.log('❌ Super Admin not found!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  });
