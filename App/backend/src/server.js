// App/backend/src/server.js
import express from "express";
import sequelize from "./config/database.js";
import User from "./models/User.js";

// Import Routers
import authRouter from "./routes/auth.js";
import ebayRouter from "./routes/ebay.js";
import invitationsRouter from "./routes/invitations.js"; // Now implemented
import organizationsRouter from "./routes/organizations.js"; // Now implemented
import pointsRouter from "./routes/points.js"; // NEW
import sponsorRouter from "./routes/sponsor.js"; // NEW
import driverRouter from "./routes/driver.js"; // NEW

// Import models to ensure associations are registered
import "./models/Organization.js";
import "./models/SponsorDriverLink.js";
import "./models/SponsorOrganizationLink.js";
import "./models/OrganizationCatalog.js";
import "./models/PointsBalance.js";
import "./models/PointsTransaction.js";


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
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH'); // Added PATCH
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


// === API Routes ===

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

// Mount auth routes
app.use(authRouter); // Contains /api/signup, /api/login, etc.

// Mount functional routes
app.use("/api/ebay", ebayRouter);
app.use(invitationsRouter); // Contains /api/invite-driver, /api/driver/invitations, etc.
app.use("/api/organizations", organizationsRouter);
app.use("/api/points", pointsRouter);
app.use(sponsorRouter); // Contains /api/available-drivers, /api/sponsor/drivers, etc.
app.use("/api/driver", driverRouter); // Contains /api/driver/my-organization



// Admin/Demo routes (from original file)
app.get("/api/drivers", async (req, res) => {
  try {
    const drivers = await User.findAll({
      where: { role: "driver" },
      attributes: ["username", "email", "last_login", "created_at"],
    });
    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});
app.get("/api/sponsors", async (req, res) => {
  try {
    const sponsors = await User.findAll({
      where: { role: "sponsor" },
      attributes: ["username", "email", "last_login", "created_at"]
    });
    res.json({ sponsors });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sponsors" });
  }
});


// Test database connection on startup
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully');
    
    // Sync models - use { alter: true } in dev, { force: true } to reset
    // sequelize.sync({ alter: true }); 
    // console.log("Models synced");

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