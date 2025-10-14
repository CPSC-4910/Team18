// App/backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { Op } from "sequelize";

const router = express.Router();

// POST /api/signup
router.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    // Check if username or email already exists
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

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      created_at: new Date(),
    });

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      account_created_at: new Date(), // <--- tracks signup time
      last_login: null,               // initialize as null
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
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    // Find user by username
     const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // 🆕 Update last_login timestamp
    user.last_login = new Date();
    await user.save();

    // Login success
    res.status(200).json({
      message: "Login successful",
      user: {
        username: user.username,
        email: user.email,
        account_created_at: user.account_created_at,
        last_login: user.last_login,
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;