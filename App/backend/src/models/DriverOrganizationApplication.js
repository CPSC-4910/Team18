// backend/src/models/DriverOrganizationApplication.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Organization from "./Organization.js";

const DriverOrganizationApplication = sequelize.define(
  "DriverOrganizationApplication",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    driver_username: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "denied"),
      defaultValue: "pending",
    },

    applied_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "DriverOrganizationApplications",
  }
);

// Associations
DriverOrganizationApplication.belongsTo(Organization, {
  foreignKey: "organization_id",
});

Organization.hasMany(DriverOrganizationApplication, {
  foreignKey: "organization_id",
});

export default DriverOrganizationApplication;
