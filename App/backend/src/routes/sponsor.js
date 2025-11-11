import express from "express";
import { Op } from "sequelize";
import SponsorDriverLink from "../models/SponsorDriverLink.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/available-drivers/:username - Get drivers NOT linked to this sponsor
router.get("/api/available-drivers/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const linkedDrivers = await SponsorDriverLink.findAll({
      where: { sponsor_username: username },
      attributes: ['driver_username']
    });
    const linkedUsernames = linkedDrivers.map(d => d.driver_username);

    const available = await User.findAll({
      where: {
        role: "driver",
        username: { [Op.notIn]: linkedUsernames }
      },
      attributes: ['username', 'email']
    });
    res.json(available);
  } catch (err) {
    console.error("Error fetching available drivers:", err); // Added error logging
    res.status(500).json({ error: "Failed to get available drivers" });
  }
});

// GET /api/sponsor/invited-drivers/:username - Get all drivers linked to this sponsor
router.get("/api/sponsor/invited-drivers/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const links = await SponsorDriverLink.findAll({
      where: { sponsor_username: username },
      include: [{
        model: User,
        as: 'DriverDetails', // <-- FIXED association alias
        attributes: ['email']
      }]
    });

    const formatted = links.map(link => ({
      driver_username: link.driver_username,
      driver_email: link.DriverDetails?.email || 'N/A', // <-- FIXED property access
      status: link.status,
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching invited drivers:", err); // Added error logging
    res.status(500).json({ error: "Failed to get invited/linked drivers" });
  }
});

// GET /api/sponsor/drivers/:username - Get ACCEPTED drivers (for dashboard list)
router.get("/api/sponsor/drivers/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const links = await SponsorDriverLink.findAll({
            where: { 
                sponsor_username: username,
                status: 'accepted'
            },
            include: [{
                model: User,
                as: 'DriverDetails', // <-- FIXED association alias
                attributes: ['email']
            }]
        });

        const drivers = links.map(link => ({
            username: link.driver_username,
            email: link.DriverDetails?.email || 'N/A', // <-- FIXED property access
            status: link.status,
        }));
        res.json({ drivers });
    } catch (err) {
        console.error("Error fetching sponsor drivers:", err); // Added error logging
        res.status(500).json({ error: "Failed to fetch drivers" });
    }
});

// DELETE /api/sponsor/remove-driver - Sponsor removes a driver link
router.delete("/api/sponsor/remove-driver", async (req, res) => {
  const { sponsor_username, driver_username } = req.body;
  try {
    await SponsorDriverLink.destroy({
      where: { sponsor_username, driver_username }
    });
    res.json({ message: "Driver link removed" });
  } catch (err) {
    console.error("Error removing driver:", err); // Added error logging
    res.status(500).json({ error: "Failed to remove driver" });
  }
});

export default router;