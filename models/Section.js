module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define('Section', {
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
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Section name (e.g., Western, Islamiyya, Tahfeez)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'sections',
    timestamps: true,
    underscored: true
  });

  Section.associate = (models) => {
    Section.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
    Section.hasMany(models.AcademicTerm, {
      foreignKey: 'section_id',
      as: 'terms'
    });
    Section.hasMany(models.Class, {
      foreignKey: 'section_id',
      as: 'classes'
    });
    Section.hasMany(models.Student, {
      foreignKey: 'section_id',
      as: 'students'
    });
    Section.hasMany(models.Staff, {
      foreignKey: 'active_section_id',
      as: 'staff_members'
    });
  };

  return Section;
};
