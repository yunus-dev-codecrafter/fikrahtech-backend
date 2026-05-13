'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('school_subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'subscription_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'cancelled'),
        defaultValue: 'active',
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add index for faster lookups
    await queryInterface.addIndex('school_subscriptions', ['school_id']);
    await queryInterface.addIndex('school_subscriptions', ['plan_id']);
    await queryInterface.addIndex('school_subscriptions', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('school_subscriptions');
  }
};
