// App/backend/src/models/DriverAlert.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Organization from "./Organization.js";

const DriverAlert = sequelize.define("DriverAlert", {
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
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  removed_by_username: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  removed_by_role: {
    type: DataTypes.ENUM("admin", "sponsor"),
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
  tableName: "DriverAlert",
  timestamps: false,
});

// Associations
DriverAlert.belongsTo(User, {
  foreignKey: "driver_username",
  targetKey: "username",
});

User.hasMany(DriverAlert, {
  foreignKey: "driver_username",
  sourceKey: "username",
});

DriverAlert.belongsTo(Organization, {
  foreignKey: "organization_id",
});

Organization.hasMany(DriverAlert, {
  foreignKey: "organization_id",
});

export default DriverAlert;

