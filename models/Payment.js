module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
      comment: 'Reference to the school this payment belongs to'
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'students',
        key: 'id'
      },
      comment: 'Reference to the student who made this payment'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Payment amount'
    },
    payment_type: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Type of payment (e.g., tuition, fees, etc.)'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'completed',
      allowNull: false,
      comment: 'Payment status'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date when payment was made'
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
    tableName: 'payments',
    timestamps: true,
    indexes: [
      {
        fields: ['school_id']
      },
      {
        fields: ['student_id']
      }
    ]
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
    
    Payment.belongsTo(models.Student, {
      foreignKey: 'student_id',
      as: 'student'
    });
  };

  return Payment;
};
