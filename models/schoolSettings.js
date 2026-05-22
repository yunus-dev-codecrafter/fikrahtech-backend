module.exports = (sequelize, DataTypes) => {
  const SchoolSettings = sequelize.define('SchoolSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id'
      },
      comment: 'Reference to the school this setting belongs to'
    },
    current_session: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '2024/2025',
      comment: 'Current academic session (e.g., "2024/2025")',
      field: 'currentSession'
    },
    current_term: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'First Term',
      comment: 'Current academic term (e.g., "First Term", "Second Term", "Third Term")',
      field: 'currentTerm'
    },
    max_students: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum number of students allowed',
      field: 'maxStudents'
    },
    grading_system: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '5.0',
      comment: 'Grading system used by the school',
      field: 'gradingSystem'
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'NGN',
      comment: 'Currency used for fees and payments'
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Africa/Lagos',
      comment: 'School timezone for scheduling'
    }
  }, {
    tableName: 'school_settings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['school_id']
      }
    ]
  });

  SchoolSettings.associate = (models) => {
    SchoolSettings.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
  };

  return SchoolSettings;
};
