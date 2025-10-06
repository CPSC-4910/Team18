// App/backend/src/config/database.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabaseCredentials } from "./secrets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file for local development
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let sequelize;

/**
 * Initialize database connection
 * Uses Secrets Manager in production, .env in development
 */
async function initializeDatabase() {
  const credentials = await getDatabaseCredentials();
  
  sequelize = new Sequelize(
    credentials.DB_NAME,
    credentials.DB_USER,
    credentials.DB_PASSWORD,
    {
      host: credentials.DB_HOST,
      dialect: "mysql",
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

  // Test the connection
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    throw error;
  }

  return sequelize;
}

// Export both the initialization function and a getter
export { initializeDatabase };

// For synchronous imports (will be null until initialized)
export default sequelize;