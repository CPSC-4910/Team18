// src/routes/organizationRoutes.js
import express from "express";
import pool from "../config/database.js"; // Your Sequelize instance
import { protect, isSponsor } from "../middleware/authMiddleware.js"; // Our new security

const router = express.Router();

/**
 * POST /api/organizations
 * Sponsor creates a new organization
 * This route is now SECURE.
 */
router.post("/", protect, isSponsor, async (req, res) => {
  const { name } = req.body;

  // We get the username from req.user, NOT req.body.
  // This is secure because the 'protect' middleware verified the user.
  const sponsorUsername = req.user.username;

  if (!name) {
    return res.status(400).json({ error: "Organization name is required." });
  }

  try {
    // We use the raw SQL query method, just like in your invitation.js
    await pool.query(
      `
      INSERT INTO organizations (name, sponsor_username, created_at, updated_at)
      VALUES (:name, :sponsor_username, NOW(), NOW())
      `,
      {
        replacements: {
          name: name,
          sponsor_username: sponsorUsername,
        },
      }
    );

    res.status(201).json({ success: true, message: "Organization created" });
  } catch (err) {
    // Check for duplicate name error
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "An organization with this name already exists." });
    }
    console.error("❌ Error creating organization:", err.message);
    res.status(500).json({ error: "Database error while creating organization" });
  }
});

export default router;