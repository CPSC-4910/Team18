// App/backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

const router = express.Router();

// Import User model dynamically to ensure DB is initialized
let User;
import("../models/User.js").then(module => {
  User = module.default;
});

// Health check endpoint
app.get("/api", (req, res) => {
  res.json({ message: "Backend server is running" });
});

// POST /api/signup
router.post("/api/signup", async (req, res) => {
  // Wait for User model if not loaded yet
  if (!User) {
    const module = await import("../models/User.js");
    User = module.default;
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      created_at: new Date(),
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        username: newUser.username,
        email: newUser.email,
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during signup" });
  }
});

// POST /api/login
router.post("/api/login", async (req, res) => {
  // Wait for User model if not loaded yet
  if (!User) {
    const module = await import("../models/User.js");
    User = module.default;
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const user = await User.findByPk(username);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        username: user.username,
        email: user.email,
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;