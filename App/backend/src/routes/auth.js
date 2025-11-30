// App/backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { Op } from "sequelize";
import nodemailer from "nodemailer";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import DriverOrganizationApplication from "../models/DriverOrganizationApplication.js";
import PointsBalance from "../models/PointsBalance.js";
import PointsTransaction from "../models/PointsTransaction.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";

const router = express.Router();

//nodemailer setup, this is what gets gmail to work
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // truckpoints.noreply@gmail.com
    pass: process.env.EMAIL_PASS, // app password
  },
});

// Send password reset code user for nodemailer
const sendResetEmail = async (userEmail, username, resetCode) => {
  await transporter.sendMail({
    from: `"TruckPoints" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Your TruckPoints Password Reset Code",
    text: `Hello ${username},\n\nYour password reset code is: ${resetCode}\nIt will expire in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
  });
};

//this generates a code for authentication in resetting the users password. Once the user enters their username this function sends
//the associated email a code needed to confirm the reset
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

//this function accepts the code sent to the email, and updates the users password
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

    // Log password change
    try {
      await AuditLog.create({
        event_type: "password_change",
        date: new Date(),
        username: username,
        change_type: "reset", // Password reset via email
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

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

  // Determine role
  const allowedRoles = ["driver", "sponsor", "admin"];
  const userRole = allowedRoles.includes(role) ? role : "driver";

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
    // Find user by username
    const user = await User.findByPk(username);

    if (!user) {
      console.log("[LOGIN] user not found:", username);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    console.log("[LOGIN] user found:", user.username);

    const now = new Date();

    // Reset failed attempts if last failed is more than 1 hour ago
    if (user.last_failed_at && now - user.last_failed_at > 60 * 60 * 1000) {
      user.failed_attempts = 0;
      user.last_failed_at = null;
      await user.save();
      console.log("[LOGIN] failed_attempts reset due to timeout");
    }

    // Check if account is currently locked
    if (user.locked_until && now < user.locked_until) {
      console.log("[LOGIN] account locked until", user.locked_until);
      return res.status(403).json({ error: `Account locked until ${user.locked_until.toLocaleString()}` });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] password match?", match);

    if (!match) {
      // Wrong password: increment failed attempts
      const lastFailed = user.last_failed_at || now;
      let attempts = user.failed_attempts || 0;

      // Reset counter if last failed attempt was more than 30 minutes ago
      if (now - lastFailed > 30 * 60 * 1000) {
        attempts = 1;
      } else {
        attempts += 1;
      }

      user.failed_attempts = attempts;
      user.last_failed_at = now;

      // Lock account if attempts >= 5
      if (attempts >= 5) {
        user.locked_until = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour lock
        console.log("[LOGIN] account locked due to too many failed attempts");
      }

      await user.save();

      // Log failed login attempt
      try {
        await AuditLog.create({
          event_type: "login_attempt",
          date: now,
          username: username,
          status: "failure",
        });
      } catch (auditErr) {
        console.error("Warning: Failed to create audit log:", auditErr.message);
      }

      return res.status(401).json({ error: "Invalid username or password" });
    }

    
    user.failed_attempts = 0;
    user.last_failed_at = null;
    user.locked_until = null;
    user.last_login = now;
    await user.save();

    console.log("[LOGIN OK]", user.username, "updated last_login:", user.last_login);

    // Log successful login attempt
    try {
      await AuditLog.create({
        event_type: "login_attempt",
        date: now,
        username: username,
        status: "success",
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }
    
    return res.json({
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login,
        created_at: user.created_at,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});


// DELETE /api/users/:username
router.delete("/api/users/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: `User '${username}' not found.` });
    }

    const role = user.role.toLowerCase();
    const sequelize = User.sequelize;

    // Delete all related records based on role
    if (role === "driver") {
      // Delete driver-organization links
      await DriverOrganizationLink.destroy({ where: { driver_username: username } });
      
      // Delete driver applications
      await DriverOrganizationApplication.destroy({ where: { driver_username: username } });
      
      // Delete points balances
      await PointsBalance.destroy({ where: { driver_username: username } });
      
      // Delete points transactions
      await PointsTransaction.destroy({ where: { driver_username: username } });
      
      // Delete sponsor-driver links (if table exists)
      try {
        await sequelize.query(
          `DELETE FROM SponsorDriverLink WHERE driver_username = :username`,
          { replacements: { username } }
        );
      } catch (err) {
        // Table might not exist, ignore error
        console.log("SponsorDriverLink table not found or already cleaned");
      }
    } else if (role === "sponsor") {
      // Delete sponsor-organization links
      await SponsorOrganizationLink.destroy({ where: { sponsor_username: username } });
      
      // Delete catalog items added by this sponsor
      await OrganizationCatalog.destroy({ where: { sponsor_username: username } });
      
      // Delete points transactions where sponsor awarded points
      await PointsTransaction.destroy({ where: { sponsor_username: username } });
      
      // Delete sponsor-driver links (if table exists)
      try {
        await sequelize.query(
          `DELETE FROM SponsorDriverLink WHERE sponsor_username = :username`,
          { replacements: { username } }
        );
      } catch (err) {
        // Table might not exist, ignore error
        console.log("SponsorDriverLink table not found or already cleaned");
      }
    }

    // Finally, delete the user
    await User.destroy({ where: { username } });

    res.json({
      message: `✅ User '${username}' (role: ${role}) deleted successfully, along with any linked records.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error deleting user and linked records.", details: error.message });
  }
});


// PATCH /api/users/update-email - Update user email
router.patch("/api/users/update-email", async (req, res) => {
  const { username, newEmail } = req.body;

  if (!username || !newEmail) {
    return res.status(400).json({ error: "Username and new email are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is already taken by another user
    const emailExists = await User.findOne({
      where: {
        email: newEmail,
        username: { [Op.ne]: username } // Not equal to current user
      }
    });

    if (emailExists) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Update email
    await user.update({ email: newEmail });

    res.json({
      message: "Email updated successfully",
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Update email error:", err);
    res.status(500).json({ error: "Server error updating email" });
  }
});

// PATCH /api/users/update-password - Update user password
router.patch("/api/users/update-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ password: hashedPassword });

    // Log password change
    try {
      await AuditLog.create({
        event_type: "password_change",
        date: new Date(),
        username: username,
        change_type: "update",
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ error: "Server error updating password" });
  }
});

export default router;