import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const SponsorDriverLink = sequelize.define("SponsorDriverLink", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sponsor_username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: { model: User, key: 'username' }
  },
  driver_username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: { model: User, key: 'username' }
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "declined"),
    defaultValue: "pending",
  },
}, {
  tableName: "SponsorDriverLink",
  
  // ▼▼▼ THIS IS THE FIX ▼▼▼
  // We are telling Sequelize to not look for 'linked_at' or 'updated_at'
  timestamps: false,
  // ▲▲▲ THIS IS THE FIX ▲▲▲
  
  // These lines are now ignored because timestamps are false
  // createdAt: "linked_at",
  // updatedAt: "updated_at",
});

// Associations
User.belongsToMany(User, {
  as: 'Sponsors',
  through: SponsorDriverLink,
  foreignKey: 'driver_username',
  otherKey: 'sponsor_username',
});

User.belongsToMany(User, {
  as: 'Drivers',
  through: SponsorDriverLink,
  foreignKey: 'sponsor_username',
  otherKey: 'driver_username',
});

// Associations for the routes in sponsor.js
SponsorDriverLink.belongsTo(User, {
  foreignKey: 'driver_username',
  targetKey: 'username',
  as: 'DriverDetails'
});

SponsorDriverLink.belongsTo(User, {
  foreignKey: 'sponsor_username',
  targetKey: 'username',
  as: 'SponsorDetails'
});

export default SponsorDriverLink;