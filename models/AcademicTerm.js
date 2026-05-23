module.exports = (sequelize, DataTypes) => {
  const AcademicTerm = sequelize.define('AcademicTerm', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sections',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Term name (e.g., First Term, Second Term)'
    },
    session: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Academic session (e.g., 2025/2026)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'academic_terms',
    timestamps: true,
    underscored: true
  });

  AcademicTerm.associate = (models) => {
    AcademicTerm.belongsTo(models.Section, {
      foreignKey: 'section_id',
      as: 'section'
    });
  };

  return AcademicTerm;
};
