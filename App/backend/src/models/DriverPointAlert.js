// App/backend/src/models/DriverPointAlert.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Organization from "./Organization.js";

const DriverPointAlert = sequelize.define("DriverPointAlert", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  driver_username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  organization_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("award", "deduct"),
    allowNull: false,
  },
  sponsor_username: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "DriverPointAlert",
  timestamps: false,
});

// Associations
DriverPointAlert.belongsTo(User, {
  foreignKey: "driver_username",
  targetKey: "username",
});

User.hasMany(DriverPointAlert, {
  foreignKey: "driver_username",
  sourceKey: "username",
});

DriverPointAlert.belongsTo(Organization, {
  foreignKey: "organization_id",
});

Organization.hasMany(DriverPointAlert, {
  foreignKey: "organization_id",
});

export default DriverPointAlert;



