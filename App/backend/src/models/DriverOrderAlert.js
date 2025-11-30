// App/backend/src/models/DriverOrderAlert.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Organization from "./Organization.js";

const DriverOrderAlert = sequelize.define("DriverOrderAlert", {
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
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  item_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order_summary: {
    type: DataTypes.TEXT,
    allowNull: true, // Summary of items in the order
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
  tableName: "DriverOrderAlert",
  timestamps: false,
});

// Associations
DriverOrderAlert.belongsTo(User, {
  foreignKey: "driver_username",
  targetKey: "username",
});

User.hasMany(DriverOrderAlert, {
  foreignKey: "driver_username",
  targetKey: "username",
});

DriverOrderAlert.belongsTo(Organization, {
  foreignKey: "organization_id",
  targetKey: "id",
});

Organization.hasMany(DriverOrderAlert, {
  foreignKey: "organization_id",
  targetKey: "id",
});

export default DriverOrderAlert;

