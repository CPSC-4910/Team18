// backend/src/models/Order.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Order = sequelize.define("Order", {
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
  total_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "cancelled"),
    allowNull: false,
    defaultValue: "pending",
  },
}, {
  tableName: "Order",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Order;

