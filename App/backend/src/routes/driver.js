// backend/src/routes/driver.js
import express from "express";
import SponsorDriverLink from "../models/SponsorDriverLink.js";
import Organization from "../models/Organization.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import PointsBalance from "../models/PointsBalance.js";

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
      // We only need one for this logic, but you could expand this
      order: [["updated_at", "DESC"]] 
    });

    if (!link) {
      return res.status(404).json({ error: "No accepted sponsor link found" });
    }

    // 2. Find the organization linked to that sponsor
    const orgLink = await SponsorOrganizationLink.findOne({
        where: { sponsor_username: link.sponsor_username }
        // Again, assuming one org per sponsor for now
    });

    if (!orgLink) {
        return res.status(404).json({ error: "Sponsor is not linked to an organization" });
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

export default router;