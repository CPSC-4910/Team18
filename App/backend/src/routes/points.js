// backend/src/routes/points.js
import express from "express";
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import PointsBalance from "../models/PointsBalance.js";
import PointsTransaction from "../models/PointsTransaction.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import DriverPointAlert from "../models/DriverPointAlert.js";
import DriverOrderAlert from "../models/DriverOrderAlert.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";

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
      status: "pending", // New purchases start as pending
    }, { transaction: t });

    await t.commit();

    // Log to audit log (outside transaction)
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username,
        sponsor_username: null, // Redemptions don't have a sponsor
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

// POST /api/points/checkout - Driver checks out cart and creates an order
router.post("/checkout", async (req, res) => {
  const { driver_username, organization_id, items } = req.body; // items: [{item_id, quantity}]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const t = await sequelize.transaction();
  try {
    // 1. Get the user's balance
    const balance = await PointsBalance.findOne({
      where: { driver_username, organization_id },
      transaction: t,
    });

    if (!balance) {
      await t.rollback();
      return res.status(404).json({ error: "Points balance not found" });
    }

    // 2. Get all items and calculate total
    const itemIds = items.map(i => i.item_id);
    const catalogItems = await OrganizationCatalog.findAll({
      where: { id: { [Op.in]: itemIds } },
      transaction: t,
    });

    if (catalogItems.length !== itemIds.length) {
      await t.rollback();
      return res.status(400).json({ error: "One or more items not found" });
    }

    // Create a map for quick lookup
    const itemMap = {};
    for (const item of catalogItems) {
      itemMap[item.id] = item;
    }

    // Calculate total points
    let totalPoints = 0;
    const orderItems = [];
    
    for (const cartItem of items) {
      const catalogItem = itemMap[cartItem.item_id];
      if (!catalogItem) {
        await t.rollback();
        return res.status(400).json({ error: `Item ${cartItem.item_id} not found` });
      }
      
      const quantity = cartItem.quantity || 1;
      const itemTotal = catalogItem.points_cost * quantity;
      totalPoints += itemTotal;
      
      orderItems.push({
        item_id: catalogItem.id,
        quantity: quantity,
        points_cost: catalogItem.points_cost,
        catalogItem: catalogItem, // Store for later use
      });
    }

    // 3. Check if user can afford it
    if (balance.balance < totalPoints) {
      await t.rollback();
      return res.status(400).json({ 
        error: `Insufficient points. Need ${totalPoints} points but only have ${balance.balance}.` 
      });
    }

    // 4. Create the order
    const order = await Order.create({
      driver_username,
      organization_id,
      total_points: totalPoints,
      status: "pending",
    }, { transaction: t });

    // 5. Create order items
    for (const orderItem of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        item_id: orderItem.item_id,
        quantity: orderItem.quantity,
        points_cost: orderItem.points_cost,
      }, { transaction: t });
    }

    // 6. Subtract points and log transaction
    balance.balance -= totalPoints;
    await balance.save({ transaction: t });

    await PointsTransaction.create({
      driver_username,
      organization_id,
      points: -totalPoints,
      reason: `Order #${order.id} - ${orderItems.length} item(s)`,
      type: "redeem",
      status: "pending",
    }, { transaction: t });

    // 7. Update order status to completed
    await order.update({ status: "completed" }, { transaction: t });

    await t.commit();

    // Create order alert if driver has order alerts enabled (outside transaction)
    try {
      const driver = await User.findByPk(driver_username);
      if (driver && driver.order_alerts_enabled) {
        // Get organization name
        const organization = await Organization.findByPk(organization_id);
        
        // Fetch all catalog items for the order
        const itemIds = orderItems.map(oi => oi.item_id);
        const catalogItems = await OrganizationCatalog.findAll({
          where: { id: { [Op.in]: itemIds } }
        });
        
        // Create a map for quick lookup
        const catalogMap = {};
        for (const item of catalogItems) {
          catalogMap[item.id] = item;
        }
        
        // Create summary of items
        const itemSummaries = [];
        for (const orderItem of orderItems) {
          const catalogItem = catalogMap[orderItem.item_id];
          if (catalogItem) {
            itemSummaries.push(`${catalogItem.title} (Qty: ${orderItem.quantity})`);
          } else {
            itemSummaries.push(`Item #${orderItem.item_id} (Qty: ${orderItem.quantity})`);
          }
        }
        const orderSummary = itemSummaries.join(", ");

        await DriverOrderAlert.create({
          driver_username,
          organization_id,
          organization_name: organization ? organization.name : "Unknown Organization",
          order_id: order.id,
          total_points: totalPoints,
          item_count: orderItems.length,
          order_summary: orderSummary,
          is_read: false,
        });
        
        console.log(`[ORDER ALERT] Created alert for driver ${driver_username}, order #${order.id}`);
      } else {
        console.log(`[ORDER ALERT] Skipped - driver ${driver_username} has order_alerts_enabled: ${driver?.order_alerts_enabled}`);
      }
    } catch (alertErr) {
      // If table doesn't exist, just log a warning (don't fail the order)
      if (alertErr.name === 'SequelizeDatabaseError' && alertErr.parent && alertErr.parent.code === 'ER_NO_SUCH_TABLE') {
        console.warn("Warning: DriverOrderAlert table doesn't exist. Please run the SQL script to create it.");
      } else {
        console.error("Warning: Failed to create order alert:", alertErr.message);
        console.error("Alert error stack:", alertErr.stack);
      }
    }

    // Log to audit log (outside transaction)
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username,
        sponsor_username: null, // Redemptions don't have a sponsor
        organization_id,
        points: -totalPoints,
        reason: `Order #${order.id} - ${orderItems.length} item(s)`,
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({ 
      message: "Order placed successfully!", 
      orderId: order.id,
      newBalance: balance.balance,
      totalPoints: totalPoints,
    });
  } catch (err) {
    await t.rollback();
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to checkout order", details: err.message });
  }
});

// POST /api/points/sponsor-checkout - Sponsor checks out cart for a driver
router.post("/sponsor-checkout", async (req, res) => {
  const { driver_username, sponsor_username, organization_id, items } = req.body; // items: [{item_id, quantity}]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  if (!sponsor_username) {
    return res.status(400).json({ error: "Sponsor username is required" });
  }

  // Verify sponsor has access to this organization
  const sponsorLink = await SponsorOrganizationLink.findOne({
    where: { sponsor_username, organization_id },
  });

  if (!sponsorLink) {
    return res.status(403).json({ error: "Sponsor does not have access to this organization" });
  }

  const t = await sequelize.transaction();
  try {
    // 1. Get the driver's balance
    const balance = await PointsBalance.findOne({
      where: { driver_username, organization_id },
      transaction: t,
    });

    if (!balance) {
      await t.rollback();
      return res.status(404).json({ error: "Driver points balance not found" });
    }

    // 2. Get all items and calculate total
    const itemIds = items.map(i => i.item_id);
    const catalogItems = await OrganizationCatalog.findAll({
      where: { id: { [Op.in]: itemIds } },
      transaction: t,
    });

    if (catalogItems.length !== itemIds.length) {
      await t.rollback();
      return res.status(400).json({ error: "One or more items not found" });
    }

    // Create a map for quick lookup
    const itemMap = {};
    for (const item of catalogItems) {
      itemMap[item.id] = item;
    }

    // Calculate total points
    let totalPoints = 0;
    const orderItems = [];
    
    for (const cartItem of items) {
      const catalogItem = itemMap[cartItem.item_id];
      if (!catalogItem) {
        await t.rollback();
        return res.status(400).json({ error: `Item ${cartItem.item_id} not found` });
      }
      
      const quantity = cartItem.quantity || 1;
      const itemTotal = catalogItem.points_cost * quantity;
      totalPoints += itemTotal;
      
      orderItems.push({
        item_id: catalogItem.id,
        quantity: quantity,
        points_cost: catalogItem.points_cost,
        catalogItem: catalogItem, // Store for later use
      });
    }

    // 3. Check if driver can afford it
    if (balance.balance < totalPoints) {
      await t.rollback();
      return res.status(400).json({ 
        error: `Insufficient points. Driver needs ${totalPoints} points but only has ${balance.balance}.` 
      });
    }

    // 4. Create the order
    const order = await Order.create({
      driver_username,
      organization_id,
      total_points: totalPoints,
      status: "completed", // Sponsor purchases are immediately completed
    }, { transaction: t });

    // 5. Create order items
    for (const orderItem of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        item_id: orderItem.item_id,
        quantity: orderItem.quantity,
        points_cost: orderItem.points_cost,
      }, { transaction: t });
    }

    // 6. Subtract points and log transaction
    balance.balance -= totalPoints;
    await balance.save({ transaction: t });

    await PointsTransaction.create({
      driver_username,
      organization_id,
      sponsor_username, // Record that sponsor made this purchase
      points: -totalPoints,
      reason: `Order #${order.id} - ${orderItems.length} item(s) (Purchased by sponsor: ${sponsor_username})`,
      type: "redeem",
      status: "completed",
    }, { transaction: t });

    await t.commit();

    // Create order alert if driver has order alerts enabled (outside transaction)
    try {
      const driver = await User.findByPk(driver_username);
      if (driver && driver.order_alerts_enabled) {
        // Get organization name
        const organization = await Organization.findByPk(organization_id);
        
        // Fetch all catalog items for the order
        const itemIds = orderItems.map(oi => oi.item_id);
        const catalogItems = await OrganizationCatalog.findAll({
          where: { id: { [Op.in]: itemIds } }
        });
        
        // Create a map for quick lookup
        const catalogMap = {};
        for (const item of catalogItems) {
          catalogMap[item.id] = item;
        }
        
        // Create summary of items
        const itemSummaries = [];
        for (const orderItem of orderItems) {
          const catalogItem = catalogMap[orderItem.item_id];
          if (catalogItem) {
            itemSummaries.push(`${catalogItem.title} (Qty: ${orderItem.quantity})`);
          } else {
            itemSummaries.push(`Item #${orderItem.item_id} (Qty: ${orderItem.quantity})`);
          }
        }
        const orderSummary = itemSummaries.join(", ");

        await DriverOrderAlert.create({
          driver_username,
          organization_id,
          organization_name: organization ? organization.name : "Unknown Organization",
          order_id: order.id,
          total_points: totalPoints,
          item_count: orderItems.length,
          order_summary: orderSummary,
          is_read: false,
        });
        
        console.log(`[ORDER ALERT] Created alert for driver ${driver_username}, order #${order.id} (purchased by sponsor ${sponsor_username})`);
      }
    } catch (alertErr) {
      // If table doesn't exist, just log a warning (don't fail the order)
      if (alertErr.name === 'SequelizeDatabaseError' && alertErr.parent && alertErr.parent.code === 'ER_NO_SUCH_TABLE') {
        console.warn("Warning: DriverOrderAlert table doesn't exist. Please run the SQL script to create it.");
      } else {
        console.error("Warning: Failed to create order alert:", alertErr.message);
      }
    }

    // Log to audit log (outside transaction)
    try {
      await AuditLog.create({
        event_type: "point_change",
        date: new Date(),
        driver_username,
        sponsor_username, // Record sponsor who made the purchase
        organization_id,
        points: -totalPoints,
        reason: `Order #${order.id} - ${orderItems.length} item(s) (Purchased by sponsor: ${sponsor_username})`,
      });
    } catch (auditErr) {
      console.error("Warning: Failed to create audit log:", auditErr.message);
    }

    res.json({ 
      message: `Order placed successfully for ${driver_username}!`, 
      orderId: order.id,
      newBalance: balance.balance,
      totalPoints: totalPoints,
    });
  } catch (err) {
    await t.rollback();
    console.error("Sponsor checkout error:", err);
    res.status(500).json({ error: "Failed to checkout order", details: err.message });
  }
});

export default router;