// App/backend/src/models/SponsorOrganizationLink.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Organization from "./Organization.js";

const SponsorOrganizationLink = sequelize.define(
  "SponsorOrganizationLink",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sponsor_username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("owner", "member"),
      defaultValue: "member",
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "SponsorOrganizationLink",
    timestamps: false,
  }
);

// === Associations ===

// Many-to-many between Users and Organizations
User.belongsToMany(Organization, {
  through: SponsorOrganizationLink,
  foreignKey: "sponsor_username",
  otherKey: "organization_id",
});

Organization.belongsToMany(User, {
  through: SponsorOrganizationLink,
  foreignKey: "organization_id",
  otherKey: "sponsor_username",
});

// ✅ NEW: direct relationship for eager loading
SponsorOrganizationLink.belongsTo(Organization, {
  foreignKey: "organization_id",
  as: "organization",
});

Organization.hasMany(SponsorOrganizationLink, {
  foreignKey: "organization_id",
  as: "links",
});

export default SponsorOrganizationLink;
