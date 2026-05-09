module.exports = (sequelize, DataTypes) => {
  const School = sequelize.define('School', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Legacy field - will be deprecated in favor of status
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // New subscription management fields
    subscriptionExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when school subscription expires'
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked', 'expired'),
      defaultValue: 'active',
      allowNull: false,
      comment: 'School subscription status'
    },
    trialPeriodDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false,
      comment: 'Number of trial days for new schools'
    },
    // Legacy fields - will be moved to SchoolSettings
    sub_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    current_session: {
      type: DataTypes.STRING,
      allowNull: true
    },
    current_term: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'schools',
    timestamps: true,
    hooks: {
      beforeCreate: (school) => {
        // Set subscription expiry if not provided
        if (!school.subscriptionExpiry && school.trialPeriodDays) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + school.trialPeriodDays);
          school.subscriptionExpiry = expiryDate;
        }
      },
      beforeUpdate: (school) => {
        // Auto-update status based on subscription expiry
        if (school.changed('subscriptionExpiry') || school.changed('status')) {
          const now = new Date();
          if (school.subscriptionExpiry && now > school.subscriptionExpiry && school.status === 'active') {
            school.status = 'expired';
          }
        }
      }
    }
  });

  School.associate = (models) => {
    School.hasMany(models.User, {
      foreignKey: 'school_id',
      as: 'users'
    });
  };

  return School;
};