// App/backend/src/server.js
import express from "express";
import sequelize from "./config/database.js";
import User from "./models/User.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";

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
import "./models/DriverPointAlert.js";
import "./models/DriverOrderAlert.js";
import "./models/AuditLog.js";
import "./models/Order.js";
import "./models/OrderItem.js";
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

// Add request logging middleware for debugging
app.use((req, res, next) => {
  if (req.path.startsWith("/api/users/") && req.method === "PATCH") {
    console.log(`[REQUEST LOGGER] ${req.method} ${req.path} - Body:`, req.body);
  }
  next();
});

// GET /api/users/:username - Get user details (admin only)
app.get("/api/users/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findByPk(username, {
      attributes: [
        "username",
        "email",
        "role",
        "created_at",
        "last_login",
        "point_alerts_enabled",
        "order_alerts_enabled",
        "failed_attempts",
        "last_failed_at",
        "locked_until",
      ],
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Auth
app.use(authRouter);  // contains /api/login, /api/signup

// eBay API
app.use("/api/ebay", ebayRouter);

// Organizations
app.use("/api/organizations", organizationsRouter);

// Points
app.use("/api/points", pointsRouter);

// Sponsor routes (invite removed)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/sponsor")) {
    console.log(`[SPONSOR ROUTER] ${req.method} ${req.path}`);
  }
  next();
});
app.use(sponsorRouter);

// Driver routes
app.use("/api/driver", driverRouter);

// Applications
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

app.get("/api/admins", async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: "admin" },
      attributes: ["username", "email", "last_login", "created_at"],
    });
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

// PATCH /api/users/:username - Update user (admin only)
app.patch("/api/users/:username", async (req, res) => {
  console.log(`[UPDATE USER] ===== ROUTE HIT =====`);
  console.log(`[UPDATE USER] Method: ${req.method}`);
  console.log(`[UPDATE USER] Path: ${req.path}`);
  console.log(`[UPDATE USER] Original URL: ${req.originalUrl}`);
  console.log(`[UPDATE USER] Params:`, req.params);
  
  try {
    const { username } = req.params;
    const { email, newPassword, point_alerts_enabled, order_alerts_enabled, unlock_account } = req.body;
    
    console.log(`[UPDATE USER] Updating user: ${username}`);
    console.log(`[UPDATE USER] Request body:`, { email, hasPassword: !!newPassword, point_alerts_enabled, unlock_account });
    
    const user = await User.findByPk(username);
    if (!user) {
      console.log(`[UPDATE USER] User not found: ${username}`);
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {};

    // Update email if provided
    if (email !== undefined && email !== null && email !== "") {
      if (email !== user.email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }
        
        // Check if email is already taken
        const emailExists = await User.findOne({
          where: {
            email: email,
            username: { [Op.ne]: username },
          },
        });
        if (emailExists) {
          return res.status(409).json({ error: "Email already in use" });
        }
        updates.email = email;
        console.log(`[UPDATE USER] Email will be updated to: ${email}`);
      }
    }

    // Reset password if provided
    if (newPassword !== undefined && newPassword !== null && newPassword !== "") {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
      console.log(`[UPDATE USER] Password will be updated`);
    }

    // Update point_alerts_enabled if provided
    if (point_alerts_enabled !== undefined && point_alerts_enabled !== null) {
      updates.point_alerts_enabled = Boolean(point_alerts_enabled);
      console.log(`[UPDATE USER] point_alerts_enabled will be updated to: ${updates.point_alerts_enabled}`);
    }

    // Update order_alerts_enabled if provided
    if (order_alerts_enabled !== undefined && order_alerts_enabled !== null) {
      updates.order_alerts_enabled = Boolean(order_alerts_enabled);
      console.log(`[UPDATE USER] order_alerts_enabled will be updated to: ${updates.order_alerts_enabled}`);
    }

    // Unlock account if requested
    if (unlock_account) {
      updates.locked_until = null;
      updates.failed_attempts = 0;
      updates.last_failed_at = null;
      console.log(`[UPDATE USER] Account will be unlocked`);
    }

    // Check if there are any updates to make
    if (Object.keys(updates).length === 0) {
      console.log(`[UPDATE USER] No updates to apply`);
      return res.status(400).json({ error: "No valid updates provided" });
    }

    console.log(`[UPDATE USER] Applying updates:`, updates);
    
    // Log password change if password is being updated
    if (updates.password) {
      try {
        await AuditLog.create({
          event_type: "password_change",
          date: new Date(),
          username: user.username,
          change_type: "reset", // Admin reset
        });
      } catch (auditErr) {
        console.error("Warning: Failed to create audit log:", auditErr.message);
      }
    }
    
    await user.update(updates);
    
    // Reload user to get updated values
    await user.reload();

    console.log(`[UPDATE USER] User updated successfully`);
    res.json({
      message: "User updated successfully",
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        point_alerts_enabled: user.point_alerts_enabled,
        order_alerts_enabled: user.order_alerts_enabled,
        created_at: user.created_at,
        last_login: user.last_login,
        failed_attempts: user.failed_attempts,
        locked_until: user.locked_until,
      },
    });
  } catch (err) {
    console.error("[UPDATE USER] Error updating user:", err);
    console.error("[UPDATE USER] Error details:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    
    // Provide more specific error messages
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: "Validation error", 
        details: err.errors.map(e => e.message).join(", ")
      });
    }
    
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        error: "Unique constraint violation", 
        details: err.errors.map(e => e.message).join(", ")
      });
    }
    
    res.status(500).json({ 
      error: "Failed to update user",
      details: err.message 
    });
  }
});

// ==============================
// 404 Handler - Must be after all routes
// ==============================
app.use((req, res, next) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Route not found", path: req.path, method: req.method });
});

// ==============================
// Error Handler - Must be last
// ==============================
app.use((err, req, res, next) => {
  console.error("[ERROR HANDLER]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
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
