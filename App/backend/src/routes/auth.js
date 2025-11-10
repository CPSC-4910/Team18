// App/backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { Op } from "sequelize";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
// --- 1. IMPORT MIDDLEWARE ---
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

//nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // truckpoints.noreply@gmail.com
    pass: process.env.EMAIL_PASS, // app password
  },
});

// Send password reset code
const sendResetEmail = async (userEmail, username, resetCode) => {
  await transporter.sendMail({
    from: `"TruckPoints" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Your TruckPoints Password Reset Code",
    text: `Hello ${username},\n\nYour password reset code is: ${resetCode}\nIt will expire in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
  });
};

// POST /api/request-password-reset
router.post("/api/request-password-reset", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await user.update({ reset_code: resetCode, reset_expires: expiration });
    await sendResetEmail(user.email, user.username, resetCode);

    res.json({ message: "Password reset code sent to your email." });
  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({ error: "Failed to send password reset code." });
  }
});

// POST /api/reset-password
router.post("/api/reset-password", async (req, res) => {
  const { username, code, newPassword } = req.body;
  if (!username || !code || !newPassword) {
    return res.status(400).json({ error: "Username, code, and new password are required" });
  }

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found" });

  if (user.reset_code !== code || new Date() > user.reset_expires) {
    return res.status(400).json({ error: "Invalid or expired reset code" });
  }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      reset_code: null,
      reset_expires: null
    });

    res.json({ message: "Password successfully reset!" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// POST /api/signup
router.post("/api/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const allowedRoles = ["driver", "sponsor", "admin"];
  const userRole = allowedRoles.includes(role) ? role : "driver";

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
      role: userRole,
      created_at: new Date(),
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
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
    const user = await User.findByPk(username);

    if (!user) {
      console.log("[LOGIN] user not found:", username);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    console.log("[LOGIN] user found:", user.username);

    const now = new Date();

    // Reset failed attempts logic...
    if (user.last_failed_at && now - user.last_failed_at > 60 * 60 * 1000) {
      user.failed_attempts = 0;
      user.last_failed_at = null;
      await user.save();
      console.log("[LOGIN] failed_attempts reset due to timeout");
    }

    // Check lock logic...
    if (user.locked_until && now < user.locked_until) {
      console.log("[LOGIN] account locked until", user.locked_until);
      return res.status(403).json({ error: `Account locked until ${user.locked_until.toLocaleString()}` });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] password match?", match);

    if (!match) {
      // Failed attempt logic...
      const lastFailed = user.last_failed_at || now;
      let attempts = user.failed_attempts || 0;

      if (now - lastFailed > 30 * 60 * 1000) {
        attempts = 1;
      } else {
        attempts += 1;
      }

      user.failed_attempts = attempts;
      user.last_failed_at = now;

      if (attempts >= 5) {
        user.locked_until = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour lock
        console.log("[LOGIN] account locked due to too many failed attempts");
      }

      await user.save();
      return res.status(401).json({ error: "Invalid username or password" });
    }

    
    // Successful login: reset failed attempts and update last login
    user.failed_attempts = 0;
    user.last_failed_at = null;
    user.locked_until = null;
    user.last_login = now;
    await user.save();

    console.log("[LOGIN OK]", user.username, "updated last_login:", user.last_login);

    // Create the token
    const token = jwt.sign(
      { username: user.username, role: user.role }, // Payload
      process.env.JWT_SECRET,                      // Your secret key
      { expiresIn: '1d' }                          // Token expires in 1 day
    );
    
    // --- 2. THIS IS THE FIX ---
    // Return the user object AND the token
    return res.json({
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login,
        created_at: user.created_at,
      },
      token: token, // <--- SEND THE TOKEN BACK
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});


// DELETE /api/users/:username
// --- 3. APPLY MIDDLEWARE HERE ---
// This route now first checks if the user is logged in (protect)
// and then checks if they are an admin (isAdmin).
router.delete("/users/:username", protect, isAdmin, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: `User '${username}' not found.` });
    }

    // We can remove the manual check because the 'isAdmin' middleware already did it
    // if (req.user?.role !== "admin") { ... }

    
    const [role] = [user.role.toLowerCase()];
    const sequelize = User.sequelize; 

    if (role === "driver" || role === "sponsor") {
      
      await sequelize.query(
        `
        DELETE FROM SponsorDriverLink
        WHERE sponsor_username = :username OR driver_username = :username
        `,
        { replacements: { username } }
      );
    }

    
    await User.destroy({ where: { username } });

    res.json({
      message: `✅ User '${username}' (role: ${role}) deleted successfully, along with any linked records.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error deleting user and linked records." });
  }
});



export default router;