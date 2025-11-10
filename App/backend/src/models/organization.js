import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Organization = sequelize.define("Organization", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sponsor_username: {
    type: DataTypes.STRING(50), // Must match the User.username type
    allowNull: false,
    references: {
      model: 'users', // The table name
      key: 'username', // The primary key of the users table
    },
  },
}, {
  tableName: "organizations",
  timestamps: true, // Let's have Sequelize manage created_at/updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Organization;