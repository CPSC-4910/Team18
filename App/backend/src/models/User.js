import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import DriverOrganizationLink from "./DriverOrganizationLink.js";  // <-- ADD THIS LINE

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
    type: DataTypes.ENUM("driver", "sponsor", "admin"),
    allowNull: false,
    defaultValue: "driver",
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
  },

  failed_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: "0",
  },

  last_failed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },

  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: "users",
  timestamps: false,
});

// --------------------------------------------------
// ADD THESE ASSOCIATIONS AT THE BOTTOM
// --------------------------------------------------

User.hasMany(DriverOrganizationLink, {
  foreignKey: "driver_username",
  sourceKey: "username",
});

DriverOrganizationLink.belongsTo(User, {
  foreignKey: "driver_username",
  targetKey: "username",
});

// --------------------------------------------------

export default User;
