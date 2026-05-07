require('dotenv').config(); // Load environment variables

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Set to true to see SQL queries in console
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Aiven compatibility
      }
    },
    define: {
      timestamps: true, // Adds createdAt and updatedAt to all models
      underscored: true // Uses snake_case for column names
    }
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Aiven compatibility
      }
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
};