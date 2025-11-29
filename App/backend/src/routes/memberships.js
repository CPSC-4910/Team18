// App/backend/src/routes/memberships.js
import express from "express";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import PointsBalance from "../models/PointsBalance.js";
import DriverAlert from "../models/DriverAlert.js";

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
    const { driver_username, organization_id, removed_by_username, removed_by_role } = req.body;

    if (!driver_username || !organization_id) {
      return res.status(400).json({ error: "driver_username and organization_id are required" });
    }

    // Find the organization to get its name
    const organization = await Organization.findByPk(organization_id);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
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

    // Create alert for the driver before removing the link
    // Wrap in try-catch so alert creation failure doesn't prevent driver removal
    try {
      const removedByText = removed_by_username 
        ? ` by ${removed_by_role === "admin" ? "Admin" : "Sponsor"} ${removed_by_username}`
        : "";
      await DriverAlert.create({
        driver_username,
        organization_id,
        organization_name: organization.name,
        message: `You have been removed from the organization "${organization.name}". You will no longer be able to earn or redeem points with this organization.`,
        removed_by_username: removed_by_username || null,
        removed_by_role: removed_by_role || null,
        is_read: false,
      });
    } catch (alertErr) {
      // Log the error but don't fail the operation
      // This allows driver removal to succeed even if the DriverAlert table doesn't exist yet
      console.error("Warning: Failed to create alert for driver removal:", alertErr.message);
      console.error("Note: If the DriverAlert table doesn't exist, run the SQL script to create it.");
    }

    await link.destroy();

    res.json({ message: `Driver ${driver_username} has been removed from the organization` });
  } catch (err) {
    console.error("Error removing driver from organization:", err);
    res.status(500).json({ error: "Failed to remove driver from organization" });
  }
});

export default router;