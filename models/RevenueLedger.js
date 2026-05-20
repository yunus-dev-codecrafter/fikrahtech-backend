module.exports = (sequelize, DataTypes) => {
  const RevenueLedger = sequelize.define('RevenueLedger', {
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
      }
    },
    amount_expected: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    balance_due: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('Unpaid', 'Partially Paid', 'Fully Paid'),
      defaultValue: 'Unpaid',
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'revenue_ledger',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (ledger) => {
        ledger.balance_due = parseFloat(ledger.amount_expected || 0) - parseFloat(ledger.amount_paid || 0);
        const paid = parseFloat(ledger.amount_paid || 0);
        const expected = parseFloat(ledger.amount_expected || 0);
        if (paid === 0) {
          ledger.payment_status = 'Unpaid';
        } else if (paid < expected) {
          ledger.payment_status = 'Partially Paid';
        } else {
          ledger.payment_status = 'Fully Paid';
        }
      }
    }
  });

  RevenueLedger.associate = (models) => {
    RevenueLedger.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });
  };

  return RevenueLedger;
};
