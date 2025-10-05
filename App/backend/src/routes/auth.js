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
  const { username, password } = req.body;


  console.log("[LOGIN] hit", { username, hasPassword: !!password });

  if (!username || !password) {
    console.log("[LOGIN] missing fields");
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    // Find user by username
    const user = await User.findByPk(username);
    
    if (!user) {
      console.log("[LOGIN] user not found:", username);
      return res.status(401).json({ error: "Invalid username or password" });
    }


    console.log("[LOGIN] user found:", user.username);

    // Compare password
    const match = await bcrypt.compare(password, user.password);

    console.log("[LOGIN] password match?", match);

    console.log('[LOGIN OK]', user.username, 'updating last_login at', new Date());
    //updates on real logins
    user.last_login = new Date();
    await user.save();

    
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // ✅ Record last login timestamp on successful auth
    user.last_login = new Date();
    await user.save(); // persist to DB

    console.log("[LOGIN OK]", user.username, "updated last_login:", user.last_login);

    // Respond with the minimal user info your frontend expects
    return res.json({
      user: {
        username: user.username,
        email: user.email,
        role: user.role, // ← include this only if you added the 'role' column
        last_login: user.last_login,
        created_at: user.created_at, // handy for the Drivers table
      },
    });

    // Login success
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