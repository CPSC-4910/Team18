// backend/src/routes/driver.js
import express from "express";
import Organization from "../models/Organization.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import PointsBalance from "../models/PointsBalance.js";
import DriverAlert from "../models/DriverAlert.js";

const router = express.Router();

// GET /api/driver/my-organization/:username - Get driver's *active* organization
router.get("/my-organization/:username", async (req, res) => {
  try {
    // 1. Find an accepted sponsor link
    const link = await SponsorDriverLink.findOne({
      where: { 
        driver_username: req.params.username,
        status: "accepted" 
      },
      order: [["id", "DESC"]] // Get most recent accepted link
    });

    if (!link) {
      return res.status(404).json({ error: "No accepted sponsor link found" });
    }

    // 2. Find the sponsor's ACTIVE organization
    const orgLink = await SponsorOrganizationLink.findOne({
      where: { 
        sponsor_username: link.sponsor_username,
        is_active: true  //only get active org
      }
    });

    if (!orgLink) {
      // If no active org, try to get ANY org the sponsor is part of
      const anyOrgLink = await SponsorOrganizationLink.findOne({
        where: { sponsor_username: link.sponsor_username }
      });
      
      if (!anyOrgLink) {
        return res.status(404).json({ 
          error: "Your sponsor is not linked to any organization yet. Please contact your sponsor." 
        });
      }
      
      // Use the first available org if no active one is set
      const org = await Organization.findByPk(anyOrgLink.organization_id);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Get driver's points for that org
      const balance = await PointsBalance.findOne({
        where: {
          driver_username: req.params.username,
          organization_id: org.id
        }
      });

      return res.json({
        organization: org,
        points: balance ? balance.balance : 0,
        warning: "This organization is not marked as active by your sponsor"
      });
    }
    
    // 3. Get the organization details
    const org = await Organization.findByPk(orgLink.organization_id);

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // 4. Get the driver's points for that org
    const balance = await PointsBalance.findOne({
      where: {
        driver_username: req.params.username,
        organization_id: org.id
      }
    });

    res.json({
      organization: org,
      points: balance ? balance.balance : 0
    });

  } catch (err) {
    console.error("Error fetching driver org/points:", err);
    res.status(500).json({ error: "Failed to fetch driver organization info" });
  }
});

// GET /api/driver/alerts/:username - Get all alerts for a driver
router.get("/alerts/:username", async (req, res) => {
  try {
    const alerts = await DriverAlert.findAll({
      where: { driver_username: req.params.username },
      order: [["created_at", "DESC"]],
    });
    res.json(alerts);
  } catch (err) {
    console.error("Error fetching driver alerts:", err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// PATCH /api/driver/alerts/:alertId/read - Mark an alert as read
router.patch("/alerts/:alertId/read", async (req, res) => {
  try {
    const alert = await DriverAlert.findByPk(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }
    await alert.update({ is_read: true });
    res.json({ message: "Alert marked as read" });
  } catch (err) {
    console.error("Error marking alert as read:", err);
    res.status(500).json({ error: "Failed to mark alert as read" });
  }
});

// PATCH /api/driver/alerts/:username/read-all - Mark all alerts as read for a driver
router.patch("/alerts/:username/read-all", async (req, res) => {
  try {
    await DriverAlert.update(
      { is_read: true },
      { where: { driver_username: req.params.username, is_read: false } }
    );
    res.json({ message: "All alerts marked as read" });
  } catch (err) {
    console.error("Error marking all alerts as read:", err);
    res.status(500).json({ error: "Failed to mark all alerts as read" });
  }
});

export default router;