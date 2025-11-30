// backend/src/models/AuditLog.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AuditLog = sequelize.define("AuditLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  event_type: {
    type: DataTypes.ENUM(
      "driver_application",
      "point_change",
      "password_change",
      "login_attempt"
    ),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true, // For login attempts and password changes
  },
  driver_username: {
    type: DataTypes.STRING(50),
    allowNull: true, // For driver applications and point changes
  },
  sponsor_username: {
    type: DataTypes.STRING(50),
    allowNull: true, // For driver applications and point changes
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // For driver applications
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true, // For driver applications (accept/reject) and login attempts (success/failure)
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: true, // For point changes
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true, // For driver applications and point changes
  },
  change_type: {
    type: DataTypes.STRING(50),
    allowNull: true, // For password changes (e.g., "update", "reset")
  },
}, {
  tableName: "AuditLog",
  timestamps: false,
});

export default AuditLog;

