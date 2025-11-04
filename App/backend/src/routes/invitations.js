import express from "express";
import pool from "../config/database.js"; // Sequelize instance

const router = express.Router();

/**
 * POST /api/invite-driver
 * Sponsor invites a driver (by username)
 */
router.post("/api/invite-driver", async (req, res) => {
  const { sponsor_username, driver_username } = req.body;
  if (!sponsor_username || !driver_username)
    return res.status(400).json({ error: "Missing usernames" });

  try {
    await pool.query(
      `
      INSERT INTO SponsorDriverLink (sponsor_username, driver_username, status)
      VALUES (:sponsor_username, :driver_username, 'pending')
      ON DUPLICATE KEY UPDATE status = 'pending'
      `,
      {
        replacements: { sponsor_username, driver_username },
      }
    );
    res.json({ success: true, message: "Invitation sent" });
  } catch (err) {
    console.error("❌ Error inviting driver:", err.message);
    res.status(500).json({ error: "Database error while inviting driver" });
  }
});

/**
 * GET /api/driver/invitations/:driver_username
 * Driver retrieves their invitations
 */
router.get("/api/driver/invitations/:driver_username", async (req, res) => {
  const { driver_username } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT s.username AS sponsor_username, s.email AS sponsor_email, l.status
      FROM SponsorDriverLink l
      JOIN users s ON s.username = l.sponsor_username
      WHERE l.driver_username = :driver_username
      `,
      {
        replacements: { driver_username },
      }
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching invitations:", err.message);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

/**
 * POST /api/driver/respond-invite
 * Driver accepts or declines an invite
 */
router.post("/api/driver/respond-invite", async (req, res) => {
  const { sponsor_username, driver_username, accept } = req.body;
  if (!sponsor_username || !driver_username)
    return res.status(400).json({ error: "Missing usernames" });

  const newStatus = accept ? "accepted" : "declined";

  try {
    // 1️⃣ Update the invitation status
    await pool.query(
      `
      UPDATE SponsorDriverLink
      SET status = :newStatus
      WHERE sponsor_username = :sponsor_username AND driver_username = :driver_username
      `,
      {
        replacements: { newStatus, sponsor_username, driver_username },
      }
    );

    console.log(
      `✅ Driver '${driver_username}' ${newStatus} invite from '${sponsor_username}'`
    );

    // 2️⃣ If accepted, return driver info for sponsor’s roster
    let driver = null;
    if (newStatus === "accepted") {
      const [rows] = await pool.query(
        `
        SELECT u.username, u.email, :newStatus AS status
        FROM users u
        WHERE u.username = :driver_username
        `,
        { replacements: { driver_username, newStatus } }
      );
      driver = rows?.[0] || null;
    }

    res.json({
      success: true,
      message: `Invite ${newStatus}`,
      driver,
    });
  } catch (err) {
    console.error("❌ Error updating invite status:", err.message);
    res.status(500).json({ error: "Database error while updating status" });
  }
});

/**
 * GET /api/sponsor/invited-drivers/:sponsor_username
 * Sponsor views all drivers they’ve invited (pending + accepted)
 */
router.get("/api/sponsor/invited-drivers/:sponsor_username", async (req, res) => {
  const { sponsor_username } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT u.username AS driver_username, u.email AS driver_email, l.status
      FROM SponsorDriverLink l
      JOIN users u ON u.username = l.driver_username
      WHERE l.sponsor_username = :sponsor_username
      `,
      { replacements: { sponsor_username } }
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching sponsor invited drivers:", err.message);
    console.error("➡️ SQL Error Details:", err.sqlMessage || err);
    res.status(500).json({ error: "Failed to fetch invited drivers" });
  }
});

/**
 * GET /api/sponsor/drivers/:sponsor_username
 * Sponsor roster (only accepted drivers)
 */
router.get("/api/sponsor/drivers/:sponsor_username", async (req, res) => {
  const { sponsor_username } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT u.username, u.email, l.status
      FROM SponsorDriverLink l
      JOIN users u ON u.username = l.driver_username
      WHERE l.sponsor_username = :sponsor_username
      AND l.status = 'accepted'
      `,
      { replacements: { sponsor_username } }
    );

    res.json({ drivers: rows });
  } catch (err) {
    console.error("❌ Error fetching sponsor drivers:", err.message);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

/**
 * DELETE /api/sponsor/remove-driver
 * Sponsor removes a driver from their roster
 */
router.delete("/api/sponsor/remove-driver", async (req, res) => {
  const { sponsor_username, driver_username } = req.body;

  if (!sponsor_username || !driver_username)
    return res.status(400).json({ error: "Missing usernames" });

  try {
    const [result] = await pool.query(
      `
      DELETE FROM SponsorDriverLink
      WHERE sponsor_username = :sponsor_username AND driver_username = :driver_username
      `,
      { replacements: { sponsor_username, driver_username } }
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Driver not found or already removed" });

    console.log(`🗑️ Sponsor '${sponsor_username}' removed driver '${driver_username}'`);
    res.json({ success: true, message: "Driver removed successfully" });
  } catch (err) {
    console.error("❌ Error removing driver:", err.message);
    res.status(500).json({ error: "Database error while removing driver" });
  }
});

/**
 * GET /api/drivers
 * Returns all users who have the role 'driver'
 */
router.get("/api/drivers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT username, email
      FROM users
      WHERE role = 'driver'
      ORDER BY username ASC
      `
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching drivers:", err.message);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

/**
 * GET /api/available-drivers/:sponsor_username
 * Returns all drivers not already invited or linked to the sponsor
 */
router.get("/api/available-drivers/:sponsor_username", async (req, res) => {
  const { sponsor_username } = req.params;

  if (!sponsor_username)
    return res.status(400).json({ error: "Missing sponsor username" });

  try {
    const sql = `
      SELECT u.username, u.email
      FROM users u
      LEFT JOIN SponsorDriverLink l
        ON u.username = l.driver_username
        AND l.sponsor_username = '${sponsor_username}'
      WHERE u.role = 'driver'
        AND (l.driver_username IS NULL OR l.status IN ('declined'))
      ORDER BY u.username ASC;
    `;

    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching available drivers:", err);
    res.status(500).json({
      error: "Failed to fetch available drivers",
      details: err.message,
    });
  }
});






export default router;
