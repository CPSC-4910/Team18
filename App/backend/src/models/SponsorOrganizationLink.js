import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Organization from "./Organization.js";

const SponsorOrganizationLink = sequelize.define(
  "SponsorOrganizationLink",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sponsor_username: { type: DataTypes.STRING(50), allowNull: false },
    organization_id: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.ENUM("owner", "member"), defaultValue: "member" },
    
    // ▼▼▼ NEW FIELD ▼▼▼
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // ▲▲▲ NEW FIELD ▲▲▲

    joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "SponsorOrganizationLink",
    timestamps: false,
  }
);
// ... (rest of associations are the same) ...
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
SponsorOrganizationLink.belongsTo(Organization, {
  foreignKey: "organization_id",
  as: "organization",
});
Organization.hasMany(SponsorOrganizationLink, {
  foreignKey: "organization_id",
  as: "links",
});
export default SponsorOrganizationLink;