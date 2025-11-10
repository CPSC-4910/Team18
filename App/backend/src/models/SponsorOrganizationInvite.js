// App/backend/src/models/SponsorOrganizationInvite.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Organization from "./Organization.js";
import User from "./User.js";

const SponsorOrganizationInvite = sequelize.define("SponsorOrganizationInvite", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  inviter_username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  invitee_username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "declined"),
    defaultValue: "pending",
  },
  invited_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "SponsorOrganizationInvite",
  timestamps: false,
});

export default SponsorOrganizationInvite;
