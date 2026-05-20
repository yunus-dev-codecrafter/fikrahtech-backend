module.exports = (sequelize, DataTypes) => {
  const SchoolPlan = sequelize.define('SchoolPlan', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subscription_plans',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'school_plans',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['plan_id', 'school_id']
      }
    ]
  });

  SchoolPlan.associate = (models) => {
    SchoolPlan.belongsTo(models.SubscriptionPlan, {
      foreignKey: 'plan_id',
      as: 'plan'
    });
    SchoolPlan.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
  };

  return SchoolPlan;
};
