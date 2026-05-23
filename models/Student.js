module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
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
      comment: 'Reference to the school this student belongs to'
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Student first name'
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Student last name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Student email address'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Student phone number'
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'id'
      }
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      }
    },
    profile_data: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Extended profile data for students'
    },
    admission_number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unique admission number'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'graduated'),
      defaultValue: 'active',
      allowNull: false,
      comment: 'Student enrollment status'
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
    tableName: 'students',
    timestamps: true,
    indexes: [
      {
        fields: ['school_id']
      },
      {
        fields: ['admission_number']
      }
    ]
  });

  Student.associate = (models) => {
    Student.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
    
    Student.belongsTo(models.Class, {
      foreignKey: 'class_id',
      as: 'class'
    });

    Student.belongsTo(models.Section, {
      foreignKey: 'section_id',
      as: 'section'
    });

    Student.belongsToMany(models.User, {
      through: 'StudentParents',
      foreignKey: 'student_id',
      otherKey: 'parent_id',
      as: 'parents'
    });
    
    Student.hasMany(models.Payment, {
      foreignKey: 'student_id',
      as: 'payments'
    });
  };

  return Student;
};
