module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define('Staff', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    qualifications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role_permissions: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Special roles/permissions (e.g., Headmaster, Cashier, Teacher)'
    },
    active_section_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      }
    }
  }, {
    tableName: 'staff',
    timestamps: true,
    underscored: true
  });

  Staff.associate = (models) => {
    Staff.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Staff.belongsTo(models.Section, {
      foreignKey: 'active_section_id',
      as: 'active_section'
    });
  };

  return Staff;
};
