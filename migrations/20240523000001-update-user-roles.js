'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For PostgreSQL, updating ENUM values requires a raw query or recreating the type
    // But since we want to be safe and modular:
    try {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_users_role" ADD VALUE 'staff'`);
    } catch (e) {
      console.log('Staff role might already exist');
    }
    try {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_users_role" ADD VALUE 'parent'`);
    } catch (e) {
      console.log('Parent role might already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL doesn't easily support removing enum values
    // Usually, we would leave it or recreate the table, which is risky
    // So we'll just leave it as is in the down migration for now
  }
};
