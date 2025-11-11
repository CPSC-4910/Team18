// backend/src/models/PointsTransaction.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PointsTransaction = sequelize.define("PointsTransaction", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  driver_username: { type: DataTypes.STRING(50), allowNull: false },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  sponsor_username: { type: DataTypes.STRING(50), allowNull: true }, // Who awarded?
  item_id: { type: DataTypes.INTEGER, allowNull: true }, // What was redeemed?
  points: { type: DataTypes.INTEGER, allowNull: false }, // + for award, - for redeem
  reason: { type: DataTypes.STRING(255) },
  type: { type: DataTypes.ENUM("award", "redeem"), allowNull: false },
}, {
  tableName: "PointsTransaction",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default PointsTransaction;