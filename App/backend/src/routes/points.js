// App/backend/src/routes/points.js
import express from "express";
import DriverPoints from "../models/DriverPoints.js";
import PointsTransaction from "../models/PointsTransaction.js";
import User from "../models/User.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";

const router = express.Router();

// GET /api/points/:driver_username - Get driver's point balance
router.get("/:driver_username", async (req, res) => {
  try {
    const { driver_username } = req.params;
    
    const pointsRecords = await DriverPoints.findAll({
      where: { driver_username },
      include: [
        { model: User, as: "sponsor", attributes: ["username", "email"] }
      ]
    });

    res.json(pointsRecords);
  } catch (error) {
    console.error("[POINTS GET] Error:", error);
    res.status(500).json({ error: "Failed to fetch points balance" });
  }
});

// POST /api/points/award - Sponsor awards points to driver
router.post("/award", async (req, res) => {
  try {
    const { driver_username, sponsor_username, organization_id, points, reason } = req.body;

    console.log("[POINTS AWARD] Request:", {
      driver_username,
      sponsor_username,
      organization_id,
      points,
      reason
    });

    if (!driver_username || !sponsor_username || !organization_id || !points) {
      console.log("[POINTS AWARD] Missing required fields");
      return res.status(400).json({ error: "Missing required fields: driver_username, sponsor_username, organization_id, or points" });
    }

    if (points <= 0) {
      console.log("[POINTS AWARD] Invalid points amount:", points);
      return res.status(400).json({ error: "Points must be positive" });
    }

    // Verify the driver exists and is connected to the sponsor
    const driver = await User.findOne({ where: { username: driver_username } });
    if (!driver) {
      console.log("[POINTS AWARD] Driver not found:", driver_username);
      return res.status(404).json({ error: "Driver not found" });
    }

    // Find or create driver points record
    let driverPoints = await DriverPoints.findOne({
      where: { driver_username, sponsor_username, organization_id }
    });

    if (!driverPoints) {
      console.log("[POINTS AWARD] Creating new points record");
      driverPoints = await DriverPoints.create({
        driver_username,
        sponsor_username,
        organization_id,
        points_balance: 0,
        total_earned: 0,
        total_spent: 0,
      });
    }

    // Update points
    const oldBalance = driverPoints.points_balance;
    driverPoints.points_balance += parseInt(points);
    driverPoints.total_earned += parseInt(points);
    driverPoints.last_updated = new Date();
    await driverPoints.save();

    console.log(`[POINTS AWARD] Updated balance from ${oldBalance} to ${driverPoints.points_balance}`);

    // Record transaction
    await PointsTransaction.create({
      driver_username,
      sponsor_username,
      organization_id,
      points_amount: parseInt(points),
      transaction_type: "earned",
      reason: reason || "Points awarded by sponsor",
    });

    console.log(`[POINTS AWARD] Success! ${sponsor_username} awarded ${points} points to ${driver_username}`);
    res.json({ 
      message: "Points awarded successfully", 
      newBalance: driverPoints.points_balance 
    });
  } catch (error) {
    console.error("[POINTS AWARD] Error:", error);
    console.error("[POINTS AWARD] Stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to award points",
      details: error.message 
    });
  }
});

// POST /api/points/redeem - Driver redeems points for catalog item
router.post("/redeem", async (req, res) => {
  try {
    const { driver_username, sponsor_username, organization_id, catalog_item_id } = req.body;

    if (!driver_username || !sponsor_username || !organization_id || !catalog_item_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get catalog item
    const item = await OrganizationCatalog.findByPk(catalog_item_id);
    if (!item) {
      return res.status(404).json({ error: "Catalog item not found" });
    }

    if (item.stock_status !== "available") {
      return res.status(400).json({ error: "Item is not available" });
    }

    // Get driver points
    const driverPoints = await DriverPoints.findOne({
      where: { driver_username, sponsor_username, organization_id }
    });

    if (!driverPoints) {
      return res.status(404).json({ error: "Driver points record not found" });
    }

    if (driverPoints.points_balance < item.points_cost) {
      return res.status(400).json({ 
        error: "Insufficient points",
        required: item.points_cost,
        available: driverPoints.points_balance
      });
    }

    // Deduct points
    driverPoints.points_balance -= item.points_cost;
    driverPoints.total_spent += item.points_cost;
    driverPoints.last_updated = new Date();
    await driverPoints.save();

    // Record transaction
    await PointsTransaction.create({
      driver_username,
      sponsor_username,
      organization_id,
      points_amount: -item.points_cost,
      transaction_type: "spent",
      reason: `Redeemed: ${item.title}`,
      catalog_item_id: item.id,
    });

    console.log(`[POINTS REDEEM] ${driver_username} redeemed ${item.points_cost} points for ${item.title}`);
    res.json({ 
      message: "Item redeemed successfully", 
      newBalance: driverPoints.points_balance,
      item: item
    });
  } catch (error) {
    console.error("[POINTS REDEEM] Error:", error);
    res.status(500).json({ error: "Failed to redeem item" });
  }
});

// GET /api/points/transactions/:driver_username - Get transaction history
router.get("/transactions/:driver_username", async (req, res) => {
  try {
    const { driver_username } = req.params;
    const { organization_id } = req.query;

    const where = { driver_username };
    if (organization_id) where.organization_id = organization_id;

    const transactions = await PointsTransaction.findAll({
      where,
      include: [
        { model: User, as: "sponsor", attributes: ["username", "email"] }
      ],
      order: [["created_at", "DESC"]],
      limit: 100
    });

    res.json(transactions);
  } catch (error) {
    console.error("[POINTS TRANSACTIONS] Error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;