module.exports = (sequelize, DataTypes) => {
  const SchoolSubscription = sequelize.define('SchoolSubscription', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
      onDelete: 'CASCADE'
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subscription_plans',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'school_subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['school_id']
      },
      {
        fields: ['plan_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  SchoolSubscription.associate = (models) => {
    SchoolSubscription.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
    SchoolSubscription.belongsTo(models.SubscriptionPlan, {
      foreignKey: 'plan_id',
      as: 'plan'
    });
  };

  return SchoolSubscription;
};
