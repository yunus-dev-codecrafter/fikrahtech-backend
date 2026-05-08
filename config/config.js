require('dotenv').config(); // Load environment variables

// Parse DATABASE_URL if available (Railway provides this)
function parseDatabaseUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: urlObj.port || 3306,
      database: urlObj.pathname.substring(1), // Remove leading slash
      username: urlObj.username,
      password: urlObj.password,
      ssl: { require: true, rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error);
    return null;
  }
}

// Check for DATABASE_URL first (Railway), then fall back to individual vars
const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL) || {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  ssl: { require: true, rejectUnauthorized: false }
};

// Validate required database configuration
if (!dbConfig.host || !dbConfig.username || !dbConfig.password || !dbConfig.database) {
  console.error('❌ DATABASE CONFIGURATION ERROR:');
  console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.error('DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.error('DB_USERNAME:', process.env.DB_USERNAME || 'NOT SET');
  console.error('DB_DATABASE:', process.env.DB_DATABASE || 'NOT SET');
  console.error('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
  throw new Error('Missing required database configuration. Check environment variables.');
}

console.log('✅ Database Configuration:');
console.log('Host:', dbConfig.host);
console.log('Database:', dbConfig.database);
console.log('Username:', dbConfig.username);

module.exports = {
  development: {
    ...dbConfig,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development',
    dialectOptions: {
      ssl: dbConfig.ssl
    },
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: {
    ...dbConfig,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: dbConfig.ssl
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
};