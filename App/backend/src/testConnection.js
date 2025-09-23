// backend/src/testConnection.js
import sequelize from "./config/database.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localEnv = path.resolve(__dirname, ".env");
const parentEnv = path.resolve(__dirname, "../.env");

// Try loading local first, then parent
let envPath = null;
if (dotenv.config({ path: localEnv }).parsed) {
  envPath = localEnv;
} else if (dotenv.config({ path: parentEnv }).parsed) {
  envPath = parentEnv;
} else {
  console.warn("⚠️ No .env file found in src/ or backend/");
}

console.log("✅ Using .env from:", envPath || "none");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_HOST:", process.env.DB_HOST);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
}

testConnection();
