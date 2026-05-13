module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Plan name (e.g., Basic, Pro, Enterprise)'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Monthly/yearly price in NGN'
    },
    interval: {
      type: DataTypes.ENUM('monthly', 'yearly', 'termly'),
      allowNull: false,
      defaultValue: 'monthly',
      comment: 'Billing interval'
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON or text description of plan features'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this plan is currently active'
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
    tableName: 'subscription_plans',
    timestamps: true,
    indexes: [
      {
        fields: ['name'],
        unique: true
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return SubscriptionPlan;
};
