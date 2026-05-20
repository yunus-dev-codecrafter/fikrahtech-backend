require('dotenv').config();
const db = require('./models');
const { bootstrapSystem } = require('./utils/bootstrap');

const syncDatabase = async () => {
  try {
    console.log('🔄 Running safe native schema migration overrides...');
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    try {
      await db.sequelize.query('ALTER TABLE `users` DROP FOREIGN KEY `users_ibfk_1`;');
    } catch (err) {
      console.log('ℹ️ Constraint users_ibfk_1 already dropped or not found.');
    }
    await db.sequelize.query('ALTER TABLE `users` MODIFY COLUMN `school_id` CHAR(36) NULL;');
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Native constraints unlinked and school_id successfully altered.');
  } catch (migrationError) {
    console.error('⚠️ Migration failure:', migrationError.message);
  }
  
  return db.sequelize.sync({ alter: true });
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
