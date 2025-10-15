// App/backend/src/server.js
import express from "express";
import sequelize from "./config/database.js";
import authRouter from "./routes/auth.js";
import User from "./models/User.js";
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

// GET /api/drivers — returns drivers with last_login info
app.get("/api/drivers", async (req, res) => {
  try {
    const drivers = await User.findAll({
      // If you didn't add a 'role' column, remove this where-clause
      where: { role: "driver" },
      attributes: [
        "username",
        "email",
        "last_login",
        // Use the correct created timestamp per your model naming:
        // If you use underscored: 'created_at'; if default Sequelize: 'createdAt'
        "created_at"
      ],
    });

    res.json({ drivers });
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// GET /api/sponsors — returns all sponsors
app.get("/api/sponsors", async (req, res) => {
  try {
    const sponsors = await User.findAll({
      where: { role: "sponsor" },
      attributes: ["username", "email", "last_login", "created_at"]
    });
    res.json({ sponsors });
  } catch (err) {
    console.error("Error fetching sponsors:", err);
    res.status(500).json({ error: "Failed to fetch sponsors" });
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible at http://3.229.166.87:${PORT}`);
});
