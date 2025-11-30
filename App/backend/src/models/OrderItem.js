// backend/src/models/OrderItem.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Order from "./Order.js";
import OrganizationCatalog from "./OrganizationCatalog.js";

const OrderItem = sequelize.define("OrderItem", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: "id",
    },
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: OrganizationCatalog,
      key: "id",
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  points_cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "OrderItem",
  timestamps: false,
});

// Associations
Order.hasMany(OrderItem, {
  foreignKey: "order_id",
  as: "items",
});

OrderItem.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

OrderItem.belongsTo(OrganizationCatalog, {
  foreignKey: "item_id",
  as: "item",
});

export default OrderItem;

