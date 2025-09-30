import express from "express";
import bcrypt from "bcrypt";
import User from "../models/users.js";  // your User model

const router = express.Router();

// POST /login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    // Find user by username
    const user = await User.findByPk(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare password (assuming passwords are hashed in DB)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Login success
    res.status(200).json({ message: "Login successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
