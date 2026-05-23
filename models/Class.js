module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
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
      comment: 'Class name (e.g., JSS 1, Grade 3)'
    }
  }, {
    tableName: 'classes',
    timestamps: true,
    underscored: true
  });

  Class.associate = (models) => {
    Class.belongsTo(models.Section, {
      foreignKey: 'section_id',
      as: 'section'
    });
    Class.hasMany(models.Student, {
      foreignKey: 'class_id',
      as: 'students'
    });
  };

  return Class;
};
