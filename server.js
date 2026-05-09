require('dotenv').config();
const app = require('./app');
const db = require('./models'); // Import the Sequelize instance
const { bootstrapSystem } = require('./utils/bootstrap');

const PORT = process.env.PORT || 3000;

// Sync Sequelize models with database
db.sequelize.sync({ alter: true }) // Use alter: true to update schema without dropping data
  .then(async () => {
    console.log('Database synced successfully.');
    
    // Run system bootstrap after database sync
    const bootstrapResult = await bootstrapSystem();
    
    if (bootstrapResult.success) {
      console.log(' FikrahTech is ready for operation!');
    } else {
      console.log(' Server starting with bootstrap warnings...');
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });
