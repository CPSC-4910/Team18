// App/backend/src/server.js
import express from "express";
import cors from "cors";
import sequelize from "./config/database.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/userRoute.js";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", authRouter);
app.use("/api/users", userRouter);


//auto create tables if they don't exist (dev-only)
(async () => {
  try {
    await sequelize.sync(); // dev-only: creates tables if missing
    console.log("✅ Sequelize synced");
  } catch (e) {
    console.error("❌ Sequelize sync failed:", e);
  }
})();


// CORS middleware - allows requests from frontend
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",   // Vite dev
  "http://localhost:3000",   // keep if you sometimes run on 3000
  process.env.FRONTEND_ORIGIN,   // e.g. https://your-amplify-id.amplifyapp.com
  process.env.FRONTEND_ORIGIN_2, // e.g. https://www.yourdomain.com
].filter(Boolean));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
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


// Mount auth routes (handles /api/signup and /api/login)
app.use(authRouter);

// Test database connection on startup
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});