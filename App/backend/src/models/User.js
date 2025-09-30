import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: "users",   // ensure Sequelize uses the exact table name
  timestamps: false,    // no createdAt / updatedAt columns in your table
});

export default User;
