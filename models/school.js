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
      allowNull: false,
      unique: true
    },
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    sub_expiry: {
      type: DataTypes.DATE,
      allowNull: true // Can be null if subscription is not yet set or perpetual
    },
    current_session: {
      type: DataTypes.STRING,
      allowNull: true // e.g., "2023/2024"
    },
    current_term: {
      type: DataTypes.STRING,
      allowNull: true // e.g., "First Term"
    }
  }, {
    tableName: 'schools', // Explicitly define table name
    timestamps: true // createdAt, updatedAt
  });

  School.associate = (models) => {
    School.hasMany(models.User, {
      foreignKey: 'school_id',
      as: 'users'
    });
  };

  return School;
};