require('dotenv').config();
const db = require('./models');
const { bootstrapSystem } = require('./utils/bootstrap');

const syncDatabase = async () => {
  console.log('🔄 Syncing database schema for PostgreSQL...');
  await db.sequelize.sync();
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
