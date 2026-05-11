module.exports = (sequelize, DataTypes) => {
  const AcademicSession = sequelize.define('AcademicSession', {
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
      comment: 'Reference to the school this session belongs to'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Academic session name (e.g., 2025/2026)'
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether this is the current academic session'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'academic_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['school_id']
      },
      {
        fields: ['name']
      }
    ]
  });

  AcademicSession.associate = (models) => {
    AcademicSession.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
  };

  return AcademicSession;
};
