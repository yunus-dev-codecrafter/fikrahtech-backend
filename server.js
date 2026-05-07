require('dotenv').config();
const app = require('./app');
const db = require('./models'); // Import the Sequelize instance

const PORT = process.env.PORT || 3000;

// Sync Sequelize models with the database
db.sequelize.sync() // Use { force: true } for development to drop and recreate tables
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });
