// App/backend/src/server.js
import express from "express";
import sequelize from "./config/database.js";
import User from "./models/User.js";

// Import Routers
import authRouter from "./routes/auth.js";
import ebayRouter from "./routes/ebay.js";
import organizationsRouter from "./routes/organizations.js";
import pointsRouter from "./routes/points.js";
import sponsorRouter from "./routes/sponsor.js";
import driverRouter from "./routes/driver.js";
import applicationsRouter from "./routes/applications.js";
import membershipsRouter from "./routes/memberships.js";



// Import models to register associations
import "./models/Organization.js";
import "./models/SponsorOrganizationLink.js";
import "./models/OrganizationCatalog.js";
import "./models/PointsBalance.js";
import "./models/PointsTransaction.js";
import "./models/DriverAlert.js";
import reportsRouter from "./routes/reports.js";


const app = express();

// Middleware
app.use(express.json());

app.use("/api/reports", reportsRouter);

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://cpsc4911.com",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || origin?.includes("amplifyapp.com")) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ==============================
// Health Check Routes
// ==============================
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

// ==============================
// MAIN API ROUTES
// ==============================

// Auth
app.use(authRouter);  // contains /api/login, /api/signup

// eBay API
app.use("/api/ebay", ebayRouter);

// Organizations
app.use("/api/organizations", organizationsRouter);

// Points
app.use("/api/points", pointsRouter);

// Sponsor routes (invite removed)
app.use(sponsorRouter);

// Driver routes
app.use("/api/driver", driverRouter);

// Applications (the NEW system)
app.use("/api/applications", applicationsRouter);

app.use("/api/memberships", membershipsRouter);


// ==============================
// Admin/Demo Routes
// ==============================
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
      attributes: ["username", "email", "last_login", "created_at"],
    });
    res.json({ sponsors });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sponsors" });
  }
});

// ==============================
// Database Init
// ==============================
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection established successfully");
  })
  .catch(err => {
    console.error("❌ Unable to connect to database:", err);
  });

// ==============================
// Start Server
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible at http://3.229.166.87:${PORT}`);
});
