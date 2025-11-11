// backend/src/routes/points.js
import express from "express";
import sequelize from "../config/database.js";
import PointsBalance from "../models/PointsBalance.js";
import PointsTransaction from "../models/PointsTransaction.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";

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

  const t = await sequelize.transaction();
  try {
    // 1. Create the transaction log
    await PointsTransaction.create({
      driver_username,
      organization_id,
      sponsor_username,
      points: points,
      reason: reason || "Points awarded by sponsor",
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

    // Commit the transaction
    await t.commit();

    res.json({ message: "Points awarded successfully", newBalance: balance.balance });
  } catch (err) {
    await t.rollback();
    console.error("Award points error:", err);
    res.status(500).json({ error: "Failed to award points" });
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