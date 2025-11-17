import express from "express";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
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

export default router;
