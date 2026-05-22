const bcrypt = require('bcryptjs'); // For password hashing

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'schools', // Refers to the 'schools' table
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'proprietor'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    needs_password_reset: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'users', // Explicitly define table name
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          console.log('🔍 DEBUG: User model beforeCreate hook triggered');
          console.log('🔍 DEBUG: Password before hashing:', user.password ? 'PROVIDED' : 'NOT_PROVIDED');
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          console.log('🔍 DEBUG: Password after model hook hashing:', user.password.substring(0, 20) + '...');
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          console.log('🔍 DEBUG: User model beforeUpdate hook triggered');
          console.log('🔍 DEBUG: Password before hashing:', user.password ? 'PROVIDED' : 'NOT_PROVIDED');
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          console.log('🔍 DEBUG: Password after model hook hashing:', user.password.substring(0, 20) + '...');
        }
      }
    }
  });

  User.associate = (models) => {
    User.belongsTo(models.School, {
      foreignKey: {
        name: 'school_id',
        allowNull: true
      },
      as: 'school',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  // Instance method to compare passwords
  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  return User;
};