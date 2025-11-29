// backend/src/routes/points.js
import express from "express";
import sequelize from "../config/database.js";
import PointsBalance from "../models/PointsBalance.js";
import PointsTransaction from "../models/PointsTransaction.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import DriverPointAlert from "../models/DriverPointAlert.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();

// GET /api/points/balances/:orgId - Get all driver balances for an organization
router.get("/balances/:orgId", async (req, res) => {
  try {
    const balances = await PointsBalance.findAll({
      where: { organization_id: req.params.orgId },
      order: [["driver_username", "ASC"]]
    });
    
    res.json(balances);
  } catch (err) {
    console.error("Error fetching balances:", err);
    res.status(500).json({ error: "Failed to fetch points balances" });
  }
});

// POST /api/points/award - Sponsor awards points to driver
router.post("/award", async (req, res) => {
  const {
    driver_username,
    sponsor_username,
    organization_id,
    points,
    reason,
  } = req.body;

  if (points <= 0) {
    return res.status(400).json({ error: "Points must be a positive number" });
  }

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ error: "Reason is required for point changes" });
  }

  const t = await sequelize.transaction();
  try {
    // Get organization name for alert
    const organization = await Organization.findByPk(organization_id, { transaction: t });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // 1. Create the transaction log
    await PointsTransaction.create({
      driver_username,
      organization_id,
      sponsor_username,
      points: points,
      reason: reason,
      type: "award",
    }, { transaction: t });

    // 2. Find or create the driver's balance
    const [balance, created] = await PointsBalance.findOrCreate({
      where: { driver_username, organization_id },
      defaults: { balance: 0 },
      transaction: t,
    });

    // 3. Update the balance
    balance.balance += points;
    await balance.save({ transaction: t });

    // 4. Create alert if driver has point alerts enabled
    try {
      const driver = await User.findByPk(driver_username, { transaction: t });
      if (driver && driver.point_alerts_enabled) {
        await DriverPointAlert.create({
          driver_username,
          organization_id,
          organization_name: organization.name,
          points: points,
          reason: reason,
          type: "award",
          sponsor_username: sponsor_username,
          is_read: false,
        }, { transaction: t });
      }
    } catch (alertErr) {
      // Log but don't fail the transaction if alert creation fails
      console.error("Warning: Failed to create point alert:", alertErr.message);
    }

    // Commit the transaction
    await t.commit();

    // Log to audit log (outside transaction)
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username,
        sponsor_username,
        organization_id,
        points: points,
        reason: reason,
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({ message: "Points awarded successfully", newBalance: balance.balance });
  } catch (err) {
    await t.rollback();
    console.error("Award points error:", err);
    res.status(500).json({ error: "Failed to award points" });
  }
});

// POST /api/points/deduct - Sponsor deducts points from driver
router.post("/deduct", async (req, res) => {
  const {
    driver_username,
    sponsor_username,
    organization_id,
    points,
    reason,
  } = req.body;

  if (points <= 0) {
    return res.status(400).json({ error: "Points must be a positive number" });
  }

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ error: "Reason is required for point deductions" });
  }

  const t = await sequelize.transaction();
  try {
    // Get organization name for alert
    const organization = await Organization.findByPk(organization_id, { transaction: t });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // 1. Find the driver's balance
    const balance = await PointsBalance.findOne({
      where: { driver_username, organization_id },
      transaction: t,
    });

    if (!balance) {
      return res.status(404).json({ error: "Driver balance not found" });
    }

    // 2. Check if driver has enough points
    if (balance.balance < points) {
      return res.status(400).json({ 
        error: `Insufficient points. Driver has ${balance.balance} points, cannot deduct ${points} points.` 
      });
    }

    // 3. Create the transaction log
    await PointsTransaction.create({
      driver_username,
      organization_id,
      sponsor_username,
      points: -points, // Negative for deduction
      reason: reason,
      type: "deduct",
    }, { transaction: t });

    // 4. Update the balance
    balance.balance -= points;
    await balance.save({ transaction: t });

    // 5. Create alert if driver has point alerts enabled
    try {
      const driver = await User.findByPk(driver_username, { transaction: t });
      if (driver && driver.point_alerts_enabled) {
        await DriverPointAlert.create({
          driver_username,
          organization_id,
          organization_name: organization.name,
          points: -points,
          reason: reason,
          type: "deduct",
          sponsor_username: sponsor_username,
          is_read: false,
        }, { transaction: t });
      }
    } catch (alertErr) {
      // Log but don't fail the transaction if alert creation fails
      console.error("Warning: Failed to create point alert:", alertErr.message);
    }

    // Commit the transaction
    await t.commit();

    // Log to audit log (outside transaction)
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username,
        sponsor_username,
        organization_id,
        points: -points,
        reason: reason,
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({ message: "Points deducted successfully", newBalance: balance.balance });
  } catch (err) {
    await t.rollback();
    console.error("Deduct points error:", err);
    res.status(500).json({ error: "Failed to deduct points" });
  }
});

// POST /api/points/redeem - Driver redeems an item
router.post("/redeem", async (req, res) => {
  const { driver_username, itemId, organization_id } = req.body;

  const t = await sequelize.transaction();
  try {
    // 1. Get the item and the user's balance
    const item = await OrganizationCatalog.findByPk(itemId, { transaction: t });
    const balance = await PointsBalance.findOne({
      where: { driver_username, organization_id },
      transaction: t,
    });

    if (!item) return res.status(404).json({ error: "Item not found" });
    
    const cost = item.points_cost;

    // 2. Check if user can afford it
    if (!balance || balance.balance < cost) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    // 3. Subtract points and log transaction
    balance.balance -= cost;
    await balance.save({ transaction: t });

    await PointsTransaction.create({
      driver_username,
      organization_id,
      item_id: item.id,
      points: -cost, // Note: negative number
      reason: `Redeemed item: ${item.title}`,
      type: "redeem",
    }, { transaction: t });

    await t.commit();

    // Log to audit log (outside transaction)
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username,
        sponsor_username: item.sponsor_username,
        organization_id,
        points: -cost,
        reason: `Redeemed item: ${item.title}`,
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({ 
      message: "Item redeemed successfully!", 
      newBalance: balance.balance,
      itemTitle: item.title,
    });
  } catch (err) {
    await t.rollback();
    console.error("Redeem item error:", err);
    res.status(500).json({ error: "Failed to redeem item" });
  }
});

export default router;