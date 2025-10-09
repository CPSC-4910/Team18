// App/backend/src/server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "./config/database.js";
import authRouter from "./routes/auth.js";
import User from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Create express app
const app = express();
app.use(express.json());

// CORS middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",       // include vite dev if needed
  "https://cpsc4911.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || origin?.includes("amplifyapp.com")) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check endpoints
app.get("/api", (req, res) => {
  res.json({ message: "Backend server is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/api/test-db", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ message: "Database connection successful" });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// GET /api/drivers — example driver listing
app.get("/api/drivers", async (req, res) => {
  try {
    const drivers = await User.findAll({
      // If you haven’t added a `role` column, remove this `where`
      // where: { role: "driver" },
      attributes: ["username", "email", "created_at", "last_login"]
    });
    res.json({ drivers });
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// Mount auth routes (signup & login)
app.use(authRouter);

// Initialize DB and start server
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");
  } catch (err) {
    console.error("❌ Unable to connect to database:", err);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
  });
})();
