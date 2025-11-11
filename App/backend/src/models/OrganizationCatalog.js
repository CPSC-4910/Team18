import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Organization from "./Organization.js";

const OrganizationCatalog = sequelize.define("OrganizationCatalog", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  sponsor_username: { type: DataTypes.STRING(50), allowNull: false },
  item_id: { type: DataTypes.STRING(50), allowNull: false },
  title: { type: DataTypes.STRING(255) },
  price: { type: DataTypes.DECIMAL(10, 2) },
  currency: { type: DataTypes.STRING(10) },
  image_url: { type: DataTypes.STRING(500) }, // Increased length
  item_url: { type: DataTypes.STRING(500) }, // Increased length
  points_cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  
  // ▼▼▼ NEW FIELD ▼▼▼
  stock_status: {
    type: DataTypes.ENUM('available', 'out_of_stock', 'discontinued'),
    defaultValue: 'available'
  },
  // ▲▲▲ NEW FIELD ▲▲▲

}, {
  tableName: "OrganizationCatalog",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

Organization.hasMany(OrganizationCatalog, { foreignKey: "organization_id" });
OrganizationCatalog.belongsTo(Organization, { foreignKey: "organization_id" });

export default OrganizationCatalog;