module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
      comment: 'Price in NGN'
    },
    billing_cycle: {
      type: DataTypes.ENUM('monthly', 'termly', 'session'),
      allowNull: false,
      defaultValue: 'monthly',
      comment: 'Billing cycle/interval'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Discount amount'
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
