// backend/src/models/PointsBalance.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PointsBalance = sequelize.define("PointsBalance", {
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
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: "PointsBalance",
  timestamps: false,
  // Ensure a driver can only have one balance per organization
  indexes: [
    {
      unique: true,
      fields: ['driver_username', 'organization_id']
    }
  ]
});

export default PointsBalance;