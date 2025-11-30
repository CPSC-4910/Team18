// backend/src/routes/driver.js
import express from "express";
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import Organization from "../models/Organization.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import PointsBalance from "../models/PointsBalance.js";
import PointsTransaction from "../models/PointsTransaction.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import DriverAlert from "../models/DriverAlert.js";
import DriverPointAlert from "../models/DriverPointAlert.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import bcrypt from "bcrypt";

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

// GET /api/driver/point-alerts/:username - Get all point alerts for a driver
router.get("/point-alerts/:username", async (req, res) => {
  try {
    const alerts = await DriverPointAlert.findAll({
      where: { driver_username: req.params.username },
      order: [["created_at", "DESC"]],
    });
    res.json(alerts);
  } catch (err) {
    console.error("Error fetching driver point alerts:", err);
    res.status(500).json({ error: "Failed to fetch point alerts" });
  }
});

// PATCH /api/driver/point-alerts/:alertId/read - Mark a point alert as read
router.patch("/point-alerts/:alertId/read", async (req, res) => {
  try {
    const alert = await DriverPointAlert.findByPk(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }
    await alert.update({ is_read: true });
    res.json({ message: "Alert marked as read" });
  } catch (err) {
    console.error("Error marking point alert as read:", err);
    res.status(500).json({ error: "Failed to mark alert as read" });
  }
});

// GET /api/driver/point-alerts-preference/:username - Get point alerts preference
router.get("/point-alerts-preference/:username", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ point_alerts_enabled: user.point_alerts_enabled ?? true });
  } catch (err) {
    console.error("Error fetching point alerts preference:", err);
    res.status(500).json({ error: "Failed to fetch preference" });
  }
});

// PATCH /api/driver/point-alerts-preference/:username - Update point alerts preference
router.patch("/point-alerts-preference/:username", async (req, res) => {
  try {
    const { point_alerts_enabled } = req.body;
    const user = await User.findByPk(req.params.username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await user.update({ point_alerts_enabled: point_alerts_enabled ?? true });
    res.json({ message: "Preference updated", point_alerts_enabled: user.point_alerts_enabled });
  } catch (err) {
    console.error("Error updating point alerts preference:", err);
    res.status(500).json({ error: "Failed to update preference" });
  }
});

// GET /api/driver/purchases/:username - Get all purchases (redemption transactions) for a driver
router.get("/purchases/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`[PURCHASES] Fetching purchases for driver: ${username}`);
    
    // Get all redemption transactions for this driver
    // Exclude status field if it doesn't exist in database
    const transactions = await PointsTransaction.findAll({
      where: {
        driver_username: username,
        type: "redeem",
        item_id: { [Op.ne]: null }
      },
      attributes: {
        exclude: [] // We'll handle status separately
      },
      raw: false, // Get full model instances
      order: [["created_at", "DESC"]],
    });

    console.log(`[PURCHASES] Found ${transactions.length} transactions`);

    if (transactions.length === 0) {
      return res.json([]);
    }

    // Get all item IDs and organization IDs
    const itemIds = transactions.map(t => t.item_id).filter(id => id !== null);
    const orgIds = [...new Set(transactions.map(t => t.organization_id).filter(id => id !== null))];
    
    console.log(`[PURCHASES] Fetching ${itemIds.length} catalog items and ${orgIds.length} organizations`);
    
    // Fetch catalog items
    const catalogItems = await OrganizationCatalog.findAll({
      where: { id: { [Op.in]: itemIds } },
      attributes: ["id", "title", "image_url", "price", "currency", "points_cost", "item_url", "sponsor_username"]
    });

    // Fetch organizations
    const organizations = await Organization.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ["id", "name"]
    });

    console.log(`[PURCHASES] Found ${catalogItems.length} catalog items and ${organizations.length} organizations`);

    // Create maps for quick lookup
    const catalogMap = {};
    for (const item of catalogItems) {
      catalogMap[item.id] = item;
    }
    
    const orgMap = {};
    for (const org of organizations) {
      orgMap[org.id] = org;
    }

    // Combine transactions with catalog items and organizations
    const purchases = transactions.map(transaction => {
      const item = catalogMap[transaction.item_id];
      const organization = orgMap[transaction.organization_id];
      
      // Handle status field - it might not exist in database yet
      let status = "completed";
      try {
        // Try to get status from the transaction
        if (transaction.getDataValue) {
          const statusValue = transaction.getDataValue('status');
          if (statusValue !== undefined && statusValue !== null) {
            status = statusValue;
          }
        } else if (transaction.status !== undefined) {
          status = transaction.status || "completed";
        }
      } catch (e) {
        // If status field doesn't exist, default to completed
        status = "completed";
      }
      
      return {
        id: transaction.id,
        transaction_id: transaction.id,
        item_id: transaction.item_id,
        organization_id: transaction.organization_id,
        organization_name: organization ? organization.name : null,
        points: Math.abs(transaction.points), // Make positive for display
        status: status,
        created_at: transaction.created_at,
        item: item ? {
          title: item.title,
          image_url: item.image_url,
          price: item.price,
          currency: item.currency,
          points_cost: item.points_cost,
          item_url: item.item_url,
          sponsor_username: item.sponsor_username
        } : null
      };
    });

    console.log(`[PURCHASES] Returning ${purchases.length} purchases`);
    res.json(purchases);
  } catch (err) {
    console.error("Error fetching driver purchases:", err);
    console.error("Error stack:", err.stack);
    
    // If error is about status column, try query without it
    if (err.message && err.message.includes("Unknown column 'status'")) {
      console.log("[PURCHASES] Retrying without status column...");
      try {
        const { username } = req.params;
        const transactions = await sequelize.query(
          `SELECT id, driver_username, organization_id, sponsor_username, item_id, points, reason, type, created_at 
           FROM PointsTransaction 
           WHERE driver_username = :username AND type = 'redeem' AND item_id IS NOT NULL 
           ORDER BY created_at DESC`,
          {
            replacements: { username },
            type: sequelize.QueryTypes.SELECT
          }
        );

        if (transactions.length === 0) {
          return res.json([]);
        }

        const itemIds = transactions.map(t => t.item_id).filter(id => id !== null);
        const orgIds = [...new Set(transactions.map(t => t.organization_id).filter(id => id !== null))];

        const catalogItems = await OrganizationCatalog.findAll({
          where: { id: { [Op.in]: itemIds } },
          attributes: ["id", "title", "image_url", "price", "currency", "points_cost", "item_url", "sponsor_username"]
        });

        const organizations = await Organization.findAll({
          where: { id: { [Op.in]: orgIds } },
          attributes: ["id", "name"]
        });

        const catalogMap = {};
        for (const item of catalogItems) {
          catalogMap[item.id] = item;
        }
        
        const orgMap = {};
        for (const org of organizations) {
          orgMap[org.id] = org;
        }

        const purchases = transactions.map(transaction => {
          const item = catalogMap[transaction.item_id];
          const organization = orgMap[transaction.organization_id];
          
          return {
            id: transaction.id,
            transaction_id: transaction.id,
            item_id: transaction.item_id,
            organization_id: transaction.organization_id,
            organization_name: organization ? organization.name : null,
            points: Math.abs(transaction.points),
            status: "completed", // Default since column doesn't exist
            created_at: transaction.created_at,
            item: item ? {
              title: item.title,
              image_url: item.image_url,
              price: item.price,
              currency: item.currency,
              points_cost: item.points_cost,
              item_url: item.item_url,
              sponsor_username: item.sponsor_username
            } : null
          };
        });

        return res.json(purchases);
      } catch (retryErr) {
        console.error("Error on retry:", retryErr);
        return res.status(500).json({ error: "Failed to fetch purchases", details: retryErr.message });
      }
    }
    
    res.status(500).json({ error: "Failed to fetch purchases", details: err.message });
  }
});

// POST /api/driver/purchases/:transactionId/cancel - Cancel a purchase and refund points
router.post("/purchases/:transactionId/cancel", async (req, res) => {
  const { transactionId } = req.params;
  const t = await sequelize.transaction();
  
  try {
    // Get the transaction
    const transaction = await PointsTransaction.findByPk(transactionId, { transaction: t });
    
    if (!transaction) {
      await t.rollback();
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (transaction.type !== "redeem") {
      await t.rollback();
      return res.status(400).json({ error: "This transaction is not a purchase" });
    }

    if (transaction.status === "cancelled") {
      await t.rollback();
      return res.status(400).json({ error: "This purchase is already cancelled" });
    }

    // Get the item details for audit log
    const item = await OrganizationCatalog.findByPk(transaction.item_id, { transaction: t });
    
    // Refund points (points are negative, so we add them back)
    const refundAmount = Math.abs(transaction.points);
    const balance = await PointsBalance.findOne({
      where: {
        driver_username: transaction.driver_username,
        organization_id: transaction.organization_id
      },
      transaction: t
    });

    if (!balance) {
      await t.rollback();
      return res.status(404).json({ error: "Points balance not found" });
    }

    // Refund the points
    balance.balance += refundAmount;
    await balance.save({ transaction: t });

    // Create a refund transaction
    await PointsTransaction.create({
      driver_username: transaction.driver_username,
      organization_id: transaction.organization_id,
      item_id: transaction.item_id,
      points: refundAmount, // Positive for refund
      reason: `Refund for cancelled purchase: ${item ? item.title : "Item"}`,
      type: "award", // Refund is treated as an award
      status: "completed"
    }, { transaction: t });

    // Update the original transaction status
    await transaction.update({ status: "cancelled" }, { transaction: t });

    await t.commit();

    // Log to audit log
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username: transaction.driver_username,
        sponsor_username: item ? item.sponsor_username : null,
        organization_id: transaction.organization_id,
        points: refundAmount,
        reason: `Refund for cancelled purchase: ${item ? item.title : "Item"}`,
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({
      message: "Purchase cancelled and points refunded",
      newBalance: balance.balance,
      refundAmount
    });
  } catch (err) {
    await t.rollback();
    console.error("Error cancelling purchase:", err);
    res.status(500).json({ error: "Failed to cancel purchase" });
  }
});

// PATCH /api/driver/purchases/:transactionId/update - Update a purchase (change item)
router.patch("/purchases/:transactionId/update", async (req, res) => {
  const { transactionId } = req.params;
  const { newItemId } = req.body;
  const t = await sequelize.transaction();
  
  try {
    if (!newItemId) {
      await t.rollback();
      return res.status(400).json({ error: "newItemId is required" });
    }

    // Get the original transaction
    const transaction = await PointsTransaction.findByPk(transactionId, { transaction: t });
    
    if (!transaction) {
      await t.rollback();
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (transaction.type !== "redeem") {
      await t.rollback();
      return res.status(400).json({ error: "This transaction is not a purchase" });
    }

    if (transaction.status === "cancelled") {
      await t.rollback();
      return res.status(400).json({ error: "Cannot update a cancelled purchase" });
    }

    // Get the old and new items
    const oldItem = await OrganizationCatalog.findByPk(transaction.item_id, { transaction: t });
    const newItem = await OrganizationCatalog.findByPk(newItemId, { transaction: t });
    
    if (!newItem) {
      await t.rollback();
      return res.status(404).json({ error: "New item not found" });
    }

    const oldCost = Math.abs(transaction.points);
    const newCost = newItem.points_cost;
    const balance = await PointsBalance.findOne({
      where: {
        driver_username: transaction.driver_username,
        organization_id: transaction.organization_id
      },
      transaction: t
    });

    if (!balance) {
      await t.rollback();
      return res.status(404).json({ error: "Points balance not found" });
    }

    // Calculate the difference
    const costDifference = newCost - oldCost;

    // Check if driver has enough points if the new item costs more
    if (costDifference > 0 && balance.balance < costDifference) {
      await t.rollback();
      return res.status(400).json({ 
        error: `Insufficient points. Need ${costDifference} more points to update to this item.` 
      });
    }

    // Update balance
    balance.balance -= costDifference;
    await balance.save({ transaction: t });

    // Update the transaction
    await transaction.update({
      item_id: newItemId,
      points: -newCost, // Negative for purchase
      reason: `Updated purchase: ${newItem.title} (was: ${oldItem ? oldItem.title : "Item"})`
    }, { transaction: t });

    // Create a transaction record for the difference
    if (costDifference !== 0) {
      await PointsTransaction.create({
        driver_username: transaction.driver_username,
        organization_id: transaction.organization_id,
        item_id: newItemId,
        points: -costDifference, // Negative if more expensive, positive if cheaper
        reason: `Purchase update adjustment: ${newItem.title}`,
        type: costDifference > 0 ? "redeem" : "award",
        status: "completed"
      }, { transaction: t });
    }

    await t.commit();

    // Log to audit log
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username: transaction.driver_username,
        sponsor_username: newItem.sponsor_username,
        organization_id: transaction.organization_id,
        points: -costDifference,
        reason: `Purchase updated from ${oldItem ? oldItem.title : "Item"} to ${newItem.title}`,
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({
      message: "Purchase updated successfully",
      newBalance: balance.balance,
      costDifference: Math.abs(costDifference),
      newItem: {
        id: newItem.id,
        title: newItem.title,
        points_cost: newItem.points_cost
      }
    });
  } catch (err) {
    await t.rollback();
    console.error("Error updating purchase:", err);
    res.status(500).json({ error: "Failed to update purchase" });
  }
});

export default router;