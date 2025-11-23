// App/backend/src/routes/memberships.js
import express from "express";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import PointsBalance from "../models/PointsBalance.js";

const router = express.Router();

// GET ALL DRIVERS + POINTS for an organization
router.get("/by-org/:orgId", async (req, res) => {
  try {
    const orgId = req.params.orgId;

    const links = await DriverOrganizationLink.findAll({
      where: { organization_id: orgId },
      include: [{ model: User, attributes: ["username", "email"] }],
    });

    const result = [];

    for (const link of links) {
      const balance = await PointsBalance.findOne({
        where: {
          driver_username: link.driver_username,
          organization_id: orgId,
        },
      });

      result.push({
        driver_username: link.driver_username,
        email: link.User.email,
        points: balance ? balance.balance : 0,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error loading memberships:", err);
    res.status(500).json({ error: "Server error loading members" });
  }
});

// ✅ NEW ROUTE: GET MEMBERSHIPS BY DRIVER USERNAME
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Get all organizations this driver is a member of
    const links = await DriverOrganizationLink.findAll({
      where: { driver_username: username },
      include: [
        { 
          model: Organization,
          as: "Organization",  // ✅ FIXED: Added the alias
          attributes: ["id", "name", "status", "created_at"]
        }
      ],
    });

    // Format the response
    const memberships = links.map(link => ({
      organization_id: link.organization_id,
      organization_name: link.Organization?.name || "Unknown",
      joined_at: link.joined_at
    }));

    res.json(memberships);
  } catch (err) {
    console.error("Error loading driver memberships:", err);
    res.status(500).json({ error: "Server error loading memberships" });
  }
});

// DELETE remove driver from organization
router.delete("/remove-driver", async (req, res) => {
  try {
    const { driver_username, organization_id } = req.body;

    if (!driver_username || !organization_id) {
      return res.status(400).json({ error: "driver_username and organization_id are required" });
    }

    // Find and delete the driver-organization link
    const link = await DriverOrganizationLink.findOne({
      where: {
        driver_username,
        organization_id,
      },
    });

    if (!link) {
      return res.status(404).json({ error: "Driver is not a member of this organization" });
    }

    await link.destroy();

    res.json({ message: `Driver ${driver_username} has been removed from the organization` });
  } catch (err) {
    console.error("Error removing driver from organization:", err);
    res.status(500).json({ error: "Failed to remove driver from organization" });
  }
});

export default router;