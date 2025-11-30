import express from "express";
import { Op } from "sequelize";
import User from "../models/User.js";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import bcrypt from "bcrypt";

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

// GET /api/sponsor/organization-drivers/:sponsor_username - Get all drivers in sponsor's active organization
router.get("/api/sponsor/organization-drivers/:sponsor_username", async (req, res) => {
  try {
    const { sponsor_username } = req.params;
    
    // Get sponsor's active organization
    const sponsorLink = await SponsorOrganizationLink.findOne({
      where: {
        sponsor_username,
        is_active: true
      }
    });
    
    if (!sponsorLink) {
      return res.status(404).json({ error: "No active organization found for sponsor" });
    }
    
    // Get all drivers in this organization
    const driverLinks = await DriverOrganizationLink.findAll({
      where: { organization_id: sponsorLink.organization_id },
      include: [{
        model: User,
        attributes: ["username", "email", "created_at", "last_login", "point_alerts_enabled"]
      }]
    });
    
    const drivers = driverLinks.map(link => ({
      username: link.driver_username,
      email: link.User?.email || "N/A",
      created_at: link.User?.created_at || link.joined_at,
      last_login: link.User?.last_login || null,
      point_alerts_enabled: link.User?.point_alerts_enabled !== undefined ? link.User.point_alerts_enabled : true,
      joined_at: link.joined_at
    }));
    
    res.json({ drivers });
  } catch (err) {
    console.error("Error fetching organization drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// POST /api/sponsor/create-driver - Sponsor creates a new driver account
router.post("/api/sponsor/create-driver", async (req, res) => {
  try {
    const { sponsor_username, username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    
    // Get sponsor's active organization
    const sponsorLink = await SponsorOrganizationLink.findOne({
      where: {
        sponsor_username,
        is_active: true
      }
    });
    
    if (!sponsorLink) {
      return res.status(404).json({ error: "No active organization found for sponsor" });
    }
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create driver user
    const newDriver = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "driver",
      created_at: new Date(),
    });
    
    // Link driver to sponsor's organization
    await DriverOrganizationLink.create({
      driver_username: username,
      organization_id: sponsorLink.organization_id,
      joined_at: new Date()
    });
    
    res.status(201).json({
      message: "Driver created successfully",
      driver: {
        username: newDriver.username,
        email: newDriver.email,
        role: newDriver.role
      }
    });
  } catch (err) {
    console.error("Error creating driver:", err);
    res.status(500).json({ error: "Failed to create driver" });
  }
});

// GET /api/sponsor/driver/:username - Get driver details
router.get("/api/sponsor/driver/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { sponsor_username } = req.query;
    
    // Verify driver is in sponsor's organization
    const sponsorLink = await SponsorOrganizationLink.findOne({
      where: {
        sponsor_username,
        is_active: true
      }
    });
    
    if (!sponsorLink) {
      return res.status(404).json({ error: "No active organization found" });
    }
    
    const driverLink = await DriverOrganizationLink.findOne({
      where: {
        driver_username: username,
        organization_id: sponsorLink.organization_id
      }
    });
    
    if (!driverLink) {
      return res.status(403).json({ error: "Driver not found in your organization" });
    }
    
    const driver = await User.findByPk(username, {
      attributes: ["username", "email", "role", "created_at", "last_login", "point_alerts_enabled", "failed_attempts", "locked_until"]
    });
    
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    
    res.json(driver);
  } catch (err) {
    console.error("Error fetching driver details:", err);
    res.status(500).json({ error: "Failed to fetch driver details" });
  }
});

// PATCH /api/sponsor/driver/:username - Update driver information
router.patch("/api/sponsor/driver/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { sponsor_username, email, newPassword, point_alerts_enabled } = req.body;
    
    // Verify driver is in sponsor's organization
    const sponsorLink = await SponsorOrganizationLink.findOne({
      where: {
        sponsor_username,
        is_active: true
      }
    });
    
    if (!sponsorLink) {
      return res.status(404).json({ error: "No active organization found" });
    }
    
    const driverLink = await DriverOrganizationLink.findOne({
      where: {
        driver_username: username,
        organization_id: sponsorLink.organization_id
      }
    });
    
    if (!driverLink) {
      return res.status(403).json({ error: "Driver not found in your organization" });
    }
    
    const driver = await User.findByPk(username);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    
    const updates = {};
    
    // Update email if provided
    if (email !== undefined && email !== null && email !== "") {
      if (email !== driver.email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }
        
        // Check if email is already taken
        const emailExists = await User.findOne({
          where: {
            email: email,
            username: { [Op.ne]: username }
          }
        });
        if (emailExists) {
          return res.status(409).json({ error: "Email already in use" });
        }
        updates.email = email;
      }
    }
    
    // Reset password if provided
    if (newPassword !== undefined && newPassword !== null && newPassword !== "") {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }
    
    // Update point_alerts_enabled if provided
    if (point_alerts_enabled !== undefined && point_alerts_enabled !== null) {
      updates.point_alerts_enabled = Boolean(point_alerts_enabled);
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid updates provided" });
    }
    
    await driver.update(updates);
    await driver.reload();
    
    res.json({
      message: "Driver updated successfully",
      driver: {
        username: driver.username,
        email: driver.email,
        point_alerts_enabled: driver.point_alerts_enabled
      }
    });
  } catch (err) {
    console.error("Error updating driver:", err);
    res.status(500).json({ error: "Failed to update driver" });
  }
});

// POST /api/sponsor/create-sponsor - Sponsor creates a new sponsor account
router.post("/api/sponsor/create-sponsor", async (req, res) => {
  console.log("[CREATE SPONSOR] Route hit:", req.method, req.path);
  console.log("[CREATE SPONSOR] Request body:", req.body);
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create sponsor user
    const newSponsor = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "sponsor",
      created_at: new Date(),
    });
    
    res.status(201).json({
      message: "Sponsor created successfully",
      sponsor: {
        username: newSponsor.username,
        email: newSponsor.email,
        role: newSponsor.role
      }
    });
  } catch (err) {
    console.error("Error creating sponsor:", err);
    res.status(500).json({ error: "Failed to create sponsor" });
  }
});

export default router;