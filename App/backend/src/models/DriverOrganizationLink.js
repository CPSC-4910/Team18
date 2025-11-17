// App/backend/src/models/DriverOrganizationLink.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Organization from "./Organization.js";

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

//ADD ASSOCIATIONS
DriverOrganizationLink.belongsTo(Organization, {
  foreignKey: "organization_id",
  as: "Organization"
});

Organization.hasMany(DriverOrganizationLink, {
  foreignKey: "organization_id"
});

export default DriverOrganizationLink;