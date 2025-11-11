// backend/src/routes/invitations.js
import express from "express";
import { Op } from "sequelize";
import SponsorDriverLink from "../models/SponsorDriverLink.js";
import User from "../models/User.js";

const router = express.Router();

// POST /api/invite-driver - Sponsor invites a driver
router.post("/api/invite-driver", async (req, res) => {
  const { sponsor_username, driver_username } = req.body;
  try {
    const existing = await SponsorDriverLink.findOne({
      where: { sponsor_username, driver_username },
    });
    if (existing) {
      return res.status(409).json({ error: "Invitation already sent or link exists" });
    }
    await SponsorDriverLink.create({
      sponsor_username,
      driver_username,
      status: "pending",
    });
    res.status(201).json({ message: "Invitation sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// GET /api/driver/invitations/:username - Driver gets their invites
router.get("/api/driver/invitations/:username", async (req, res) => {
  try {
    const invites = await SponsorDriverLink.findAll({
      where: {
        driver_username: req.params.username,
        status: "pending" 
      },
      include: [{
        model: User,
        as: 'Sponsors',
        attributes: ['email']
      }]
    });
    
    // Format the response to match frontend expectations
    const formatted = invites.map(inv => ({
        sponsor_username: inv.sponsor_username,
        sponsor_email: inv.Sponsors[0]?.email || 'N/A',
        status: inv.status
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching invites:", err);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// POST /api/driver/respond-invite - Driver accepts/declines
router.post("/api/driver/respond-invite", async (req, res) => {
  const { sponsor_username, driver_username, accept } = req.body;
  try {
    const invite = await SponsorDriverLink.findOne({
      where: { sponsor_username, driver_username, status: "pending" },
    });
    if (!invite) {
      return res.status(404).json({ error: "Invitation not found or already handled" });
    }
    invite.status = accept ? "accepted" : "declined";
    await invite.save();
    res.json({ message: `Invitation ${invite.status}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to respond to invitation" });
  }
});

export default router;