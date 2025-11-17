// App/backend/src/models/DriverOrganizationLink.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DriverOrganizationLink = sequelize.define(
  "DriverOrganizationLink",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    driver_username: { type: DataTypes.STRING(50), allowNull: false },
    organization_id: { type: DataTypes.INTEGER, allowNull: false },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "DriverOrganizationLink",
    timestamps: false,
    indexes: [{ unique: true, fields: ["driver_username", "organization_id"] }],
  }
);

export default DriverOrganizationLink;
