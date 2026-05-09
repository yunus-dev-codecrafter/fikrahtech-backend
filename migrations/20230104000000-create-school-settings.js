'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('school_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
        onDelete: 'CASCADE',
        comment: 'Reference to the school this setting belongs to'
      },
      currentSession: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '2024/2025',
        comment: 'Current academic session (e.g., "2024/2025")'
      },
      currentTerm: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'First Term',
        comment: 'Current academic term (e.g., "First Term", "Second Term", "Third Term")'
      },
      maxStudents: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum number of students allowed'
      },
      gradingSystem: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '5.0',
        comment: 'Grading system used by the school'
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'NGN',
        comment: 'Currency used for fees and payments'
      },
      timezone: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Africa/Lagos',
        comment: 'School timezone for scheduling'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create unique index on school_id
    await queryInterface.addIndex('school_settings', ['school_id'], {
      unique: true,
      name: 'school_settings_school_id_unique'
    });

    // Create settings for existing schools
    await queryInterface.sequelize.query(`
      INSERT INTO school_settings (id, school_id, currentSession, currentTerm, createdAt, updatedAt)
      SELECT 
        UUID() as id,
        id as school_id,
        COALESCE(current_session, '2024/2025') as currentSession,
        COALESCE(current_term, 'First Term') as currentTerm,
        NOW() as createdAt,
        NOW() as updatedAt
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM school_settings)
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('school_settings');
  }
};
