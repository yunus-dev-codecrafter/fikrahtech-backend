'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new subscription fields to schools table
    await queryInterface.addColumn('schools', 'subscriptionExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when school subscription expires'
    });

    await queryInterface.addColumn('schools', 'status', {
      type: Sequelize.ENUM('active', 'blocked', 'expired'),
      defaultValue: 'active',
      allowNull: false,
      comment: 'School subscription status'
    });

    await queryInterface.addColumn('schools', 'trialPeriodDays', {
      type: Sequelize.INTEGER,
      defaultValue: 30,
      allowNull: false,
      comment: 'Number of trial days for new schools'
    });

    // Update existing schools to have proper subscription status
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET status = CASE 
        WHEN is_blocked = true THEN 'blocked'
        ELSE 'active'
      END
    `);

    // Set subscription expiry for existing schools (30 days from now)
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET subscriptionExpiry = DATE_ADD(NOW(), INTERVAL 30 DAY)
      WHERE subscriptionExpiry IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove new subscription fields from schools table
    await queryInterface.removeColumn('schools', 'subscriptionExpiry');
    await queryInterface.removeColumn('schools', 'status');
    await queryInterface.removeColumn('schools', 'trialPeriodDays');
  }
};
