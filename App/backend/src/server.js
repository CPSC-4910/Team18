// App/backend/src/server.js
import express from "express";
import { Sequelize } from "sequelize";
import authRouter from "./routes/auth.js";
import AWS from "aws-sdk";

const getDbSecret = async () => {
  const client = new AWS.SecretsManager({ region: "us-east-1" });
  const data = await client.getSecretValue({ SecretId: "truckpoints-db" }).promise();
  return JSON.parse(data.SecretString); // { username, password, host, database }
};

const app = express();

// Middleware
app.use(express.json());

// CORS middleware - allows requests from frontend
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://cpsc4911.com',
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin) || origin?.includes('amplifyapp.com')) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Main initialization function
const init = async () => {
  try {
    const secret = await getDbSecret();

    // Initialize Sequelize using secret
    const sequelize = new Sequelize(secret.database, secret.username, secret.password, {
      host: secret.host,
      dialect: "mysql", 
      logging: false,
    });

    app.locals.sequelize = sequelize;

    // Test DB connection on startup
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Mount auth routes (handles /api/signup and /api/login)
    app.use(authRouter);

    // Health check endpoints
    app.get("/api", (req, res) => res.json({ message: "Backend server is running" }));
    app.get("/api/health", (req, res) => res.json({ status: "OK", message: "Server is running" }));
    app.get("/api/test-db", async (req, res) => {
      try {
        await sequelize.authenticate();
        res.json({ message: "Database connection successful" });
      } catch (err) {
        console.error("Database connection error:", err);
        res.status(500).json({ error: "Database connection failed", details: err.message });
      }
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
      console.log(`📡 Accessible at http://<your-ec2-public-ip>:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Unable to connect to database:', err);
  }
};

init();
