import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },

  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  role: {
    type: DataTypes.ENUM('driver', 'sponsor', 'admin'),
    allowNull: false,
    defaultValue: 'driver',
  },

  reset_code: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },

  reset_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  }

}, {
  tableName: "users",
  timestamps: false, // We're manually handling created_at
});

export default User;