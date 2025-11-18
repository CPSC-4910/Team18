// backend/src/routes/applications.js
import express from "express";
import DriverOrganizationApplication from "../models/DriverOrganizationApplication.js";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";

const router = express.Router();

//
// ===========================================
// DRIVER: Submit Application
// POST /api/applications/apply
// ===========================================
router.post("/apply", async (req, res) => {
  const { driver_username, organization_id } = req.body;

  try {
    const existing = await DriverOrganizationApplication.findOne({
      where: {
        driver_username,
        organization_id,
        status: "pending",
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ msg: "You already applied to this organization." });
    }

    await DriverOrganizationApplication.create({
      driver_username,
      organization_id,
      status: "pending",
    });

    res.json({ msg: "Application submitted successfully." });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ msg: "Server error." });
  }
});

//
// ===========================================
// SPONSOR: Get pending apps for organization
// GET /api/applications/:organization_id
// ===========================================
router.get("/:organization_id", async (req, res) => {
  const { organization_id } = req.params;

  try {
    const apps = await DriverOrganizationApplication.findAll({
      where: {
        organization_id,
        status: "pending",
      },
    });

    res.json(apps);
  } catch (error) {
    console.error("Error fetching apps:", error);
    res.status(500).json({ msg: "Server error." });
  }
});

//
// ===========================================
// DRIVER: Get my apps
// GET /api/applications/by-driver/:username
// ===========================================
router.get("/by-driver/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const apps = await DriverOrganizationApplication.findAll({
      where: { driver_username: username },
      order: [["applied_at", "DESC"]],
    });

    res.json(apps);
  } catch (error) {
    console.error("Error loading driver apps:", error);
    res.status(500).json({ msg: "Server error." });
  }
});

// ===========================================
// SPONSOR: Approve Application
// PATCH /api/applications/:id/approve
// ===========================================
// ===========================================
// SPONSOR: Approve Application
// PATCH /api/applications/:id/approve
// ===========================================
router.patch("/:id/approve", async (req, res) => {
  try {
    const app = await DriverOrganizationApplication.findByPk(req.params.id);
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    // 1. Mark application accepted
    await app.update({ status: "accepted" });

    // 2. Check if membership already exists
    const existing = await DriverOrganizationLink.findOne({
      where: {
        driver_username: app.driver_username,
        organization_id: app.organization_id,
      },
    });

    if (!existing) {
      // 3. Only create membership if not already there
      await DriverOrganizationLink.create({
        driver_username: app.driver_username,
        organization_id: app.organization_id,
      });
    }

    return res.json({ message: "Application approved" });
  } catch (err) {
    console.error("Error approving application:", err);
    return res.status(500).json({ error: "Server error" });
  }
});



//
// ===========================================
// SPONSOR: Deny Application   <--- FIXED
// PATCH /api/applications/:id/deny
// ===========================================
router.patch("/:id/deny", async (req, res) => {
  try {
    const app = await DriverOrganizationApplication.findByPk(req.params.id);
    if (!app)
      return res.status(404).json({ msg: "Application not found." });

    await app.update({ status: "denied" });

    res.json({ msg: "Application denied." });
  } catch (error) {
    console.error("Error denying app:", error);
    res.status(500).json({ msg: "Server error." });
  }
});

export default router;
