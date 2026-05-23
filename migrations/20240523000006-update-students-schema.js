'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('students', 'class_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('students', 'section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('students', 'profile_data', {
      type: Sequelize.JSON,
      defaultValue: '{}'
    });

    await queryInterface.addIndex('students', ['class_id']);
    await queryInterface.addIndex('students', ['section_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('students', 'class_id');
    await queryInterface.removeColumn('students', 'section_id');
    await queryInterface.removeColumn('students', 'profile_data');
  }
};
