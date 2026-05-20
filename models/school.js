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
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    current_session: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_term: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sub_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscription_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked', 'expired'),
      defaultValue: 'active',
      allowNull: false
    },
    trial_period_days: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false
    }
  }, {
    tableName: 'schools',
    timestamps: true,
    hooks: {
      beforeCreate: (school) => {
        // Set subscription expiry if not provided
        if (!school.subscription_expiry && school.trial_period_days) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + school.trial_period_days);
          school.subscription_expiry = expiryDate;
        }
      },
      beforeUpdate: (school) => {
        // Auto-update status based on subscription expiry
        if (school.changed('subscription_expiry') || school.changed('status')) {
          const now = new Date();
          if (school.subscription_expiry && now > school.subscription_expiry && school.status === 'active') {
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
    
    School.hasOne(models.SchoolSettings, {
      foreignKey: 'id',
      as: 'settings'
    });
  };

  return School;
};