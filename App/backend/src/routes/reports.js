// In backend/src/routes/reports.js (create this file)
import express from "express";
import PointsTransaction from "../models/PointsTransaction.js";
import PointsBalance from "../models/PointsBalance.js";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import AuditLog from "../models/AuditLog.js";
import { Op } from "sequelize";

const router = express.Router();

router.get("/transactions", async (req, res) => {
  try {
    const transactions = await PointsTransaction.findAll({
      order: [["created_at", "DESC"]],
      limit: 100
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

// GET /api/reports/sponsor/driver-points - Sponsor report for driver points
router.get("/sponsor/driver-points", async (req, res) => {
  try {
    const { organization_id, driver_username, startDate, endDate } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: "organization_id is required" });
    }

    // Build where clause for transactions
    const transactionWhere = {
      organization_id: parseInt(organization_id),
    };

    // Filter by driver if specified
    if (driver_username && driver_username !== "all") {
      transactionWhere.driver_username = driver_username;
    }

    // Filter by date range if specified
    if (startDate || endDate) {
      transactionWhere.created_at = {};
      if (startDate) {
        transactionWhere.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        transactionWhere.created_at[Op.lte] = end;
      }
    }

    // Get all transactions matching the filters
    const transactions = await PointsTransaction.findAll({
      where: transactionWhere,
      order: [["created_at", "DESC"]],
    });

    // Get current balances for all drivers in this organization
    const balances = await PointsBalance.findAll({
      where: { organization_id: parseInt(organization_id) },
    });

    // Get all drivers in this organization
    const driverLinks = await DriverOrganizationLink.findAll({
      where: { organization_id: parseInt(organization_id) },
      attributes: ['driver_username'],
    });

    const driverUsernames = driverLinks.map(link => link.driver_username);

    // Build report data grouped by driver
    const reportData = {};

    // Initialize all drivers with their current balance
    for (const username of driverUsernames) {
      const balance = balances.find(b => b.driver_username === username);
      reportData[username] = {
        driver_username: username,
        total_points: balance ? balance.balance : 0,
        transactions: [],
      };
    }

    // Add transactions to each driver
    for (const transaction of transactions) {
      if (!reportData[transaction.driver_username]) {
        // Driver might have been removed but transaction still exists
        reportData[transaction.driver_username] = {
          driver_username: transaction.driver_username,
          total_points: 0,
          transactions: [],
        };
      }

      reportData[transaction.driver_username].transactions.push({
        id: transaction.id,
        points: transaction.points,
        type: transaction.type,
        reason: transaction.reason,
        sponsor_username: transaction.sponsor_username || null,
        date: transaction.created_at,
      });
    }

    // Convert to array format
    const result = Object.values(reportData);

    // If filtering by specific driver, only return that driver
    if (driver_username && driver_username !== "all") {
      const filtered = result.filter(r => r.driver_username === driver_username);
      return res.json(filtered);
    }

    res.json(result);
  } catch (err) {
    console.error("Error generating driver points report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// GET /api/reports/sales-by-sponsor - Admin report for sales by sponsor
router.get("/sales-by-sponsor", async (req, res) => {
  try {
    const { sponsor_username, startDate, endDate, view } = req.query;
    // view can be "summary" or "detailed"

    // Build where clause for redemption transactions
    const transactionWhere = {
      type: "redeem",
      item_id: { [Op.ne]: null }, // Only transactions with item_id (redemptions)
    };

    // Filter by date range if specified
    if (startDate || endDate) {
      transactionWhere.created_at = {};
      if (startDate) {
        transactionWhere.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        transactionWhere.created_at[Op.lte] = end;
      }
    }

    // Get all redemption transactions
    const transactions = await PointsTransaction.findAll({
      where: transactionWhere,
      order: [["created_at", "DESC"]],
    });

    // Get all item_ids to fetch catalog items
    const itemIds = transactions
      .map((t) => t.item_id)
      .filter((id) => id !== null);

    // Fetch catalog items
    const catalogItems = await OrganizationCatalog.findAll({
      where: {
        id: { [Op.in]: itemIds },
      },
      attributes: ["id", "sponsor_username", "title", "points_cost"],
    });

    // Create a map for quick lookup
    const catalogMap = {};
    for (const item of catalogItems) {
      catalogMap[item.id] = item;
    }

    // Combine transactions with catalog items
    const transactionsWithCatalog = transactions
      .map((transaction) => {
        const catalogItem = catalogMap[transaction.item_id];
        if (!catalogItem) return null; // Skip if catalog item not found
        
        return {
          transaction,
          catalogItem,
        };
      })
      .filter((item) => item !== null);

    // Filter by sponsor if specified
    let filteredTransactions = transactionsWithCatalog;
    if (sponsor_username && sponsor_username !== "all") {
      filteredTransactions = transactionsWithCatalog.filter(
        (t) => t.catalogItem.sponsor_username === sponsor_username
      );
    }

    // If summary view, group by sponsor
    if (view === "summary") {
      const summary = {};
      
      for (const { transaction, catalogItem } of filteredTransactions) {
        const sponsor = catalogItem.sponsor_username;
        if (!summary[sponsor]) {
          summary[sponsor] = {
            sponsor_username: sponsor,
            total_points_redeemed: 0,
            total_redemptions: 0,
            unique_drivers: new Set(),
          };
        }
        
        summary[sponsor].total_points_redeemed += Math.abs(transaction.points);
        summary[sponsor].total_redemptions += 1;
        summary[sponsor].unique_drivers.add(transaction.driver_username);
      }

      // Convert to array and format
      const result = Object.values(summary).map((item) => ({
        sponsor_username: item.sponsor_username,
        total_points_redeemed: item.total_points_redeemed,
        total_redemptions: item.total_redemptions,
        unique_drivers: item.unique_drivers.size,
      }));

      // Sort by total points redeemed (descending)
      result.sort((a, b) => b.total_points_redeemed - a.total_points_redeemed);

      return res.json(result);
    }

    // Detailed view - return all transactions with full details
    const detailed = filteredTransactions.map(({ transaction, catalogItem }) => ({
      id: transaction.id,
      driver_username: transaction.driver_username,
      sponsor_username: catalogItem.sponsor_username,
      item_title: catalogItem.title,
      points_redeemed: Math.abs(transaction.points),
      organization_id: transaction.organization_id,
      date: transaction.created_at,
    }));

    res.json(detailed);
  } catch (err) {
    console.error("Error generating sales by sponsor report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// GET /api/reports/sales-by-driver - Admin report for sales by driver
router.get("/sales-by-driver", async (req, res) => {
  try {
    const { sponsor_username, driver_username, startDate, endDate, view } = req.query;
    // view can be "summary" or "detailed"

    // Build where clause for redemption transactions
    const transactionWhere = {
      type: "redeem",
      item_id: { [Op.ne]: null }, // Only transactions with item_id (redemptions)
    };

    // Filter by driver if specified
    if (driver_username && driver_username !== "all") {
      transactionWhere.driver_username = driver_username;
    }

    // Filter by date range if specified
    if (startDate || endDate) {
      transactionWhere.created_at = {};
      if (startDate) {
        transactionWhere.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        transactionWhere.created_at[Op.lte] = end;
      }
    }

    // Get all redemption transactions
    const transactions = await PointsTransaction.findAll({
      where: transactionWhere,
      order: [["created_at", "DESC"]],
    });

    // Get all item_ids to fetch catalog items
    const itemIds = transactions
      .map((t) => t.item_id)
      .filter((id) => id !== null);

    if (itemIds.length === 0) {
      return res.json([]);
    }

    // Fetch catalog items
    const catalogItems = await OrganizationCatalog.findAll({
      where: {
        id: { [Op.in]: itemIds },
      },
      attributes: ["id", "sponsor_username", "title", "points_cost"],
    });

    // Create a map for quick lookup
    const catalogMap = {};
    for (const item of catalogItems) {
      catalogMap[item.id] = item;
    }

    // Combine transactions with catalog items
    const transactionsWithCatalog = transactions
      .map((transaction) => {
        const catalogItem = catalogMap[transaction.item_id];
        if (!catalogItem) return null; // Skip if catalog item not found
        
        return {
          transaction,
          catalogItem,
        };
      })
      .filter((item) => item !== null);

    // Filter by sponsor if specified
    let filteredTransactions = transactionsWithCatalog;
    if (sponsor_username && sponsor_username !== "all") {
      filteredTransactions = transactionsWithCatalog.filter(
        (t) => t.catalogItem.sponsor_username === sponsor_username
      );
    }

    // If summary view, group by driver
    if (view === "summary") {
      const summary = {};
      
      for (const { transaction, catalogItem } of filteredTransactions) {
        const driver = transaction.driver_username;
        if (!summary[driver]) {
          summary[driver] = {
            driver_username: driver,
            total_points_redeemed: 0,
            total_redemptions: 0,
            unique_sponsors: new Set(),
          };
        }
        
        summary[driver].total_points_redeemed += Math.abs(transaction.points);
        summary[driver].total_redemptions += 1;
        summary[driver].unique_sponsors.add(catalogItem.sponsor_username);
      }

      // Convert to array and format
      const result = Object.values(summary).map((item) => ({
        driver_username: item.driver_username,
        total_points_redeemed: item.total_points_redeemed,
        total_redemptions: item.total_redemptions,
        unique_sponsors: item.unique_sponsors.size,
      }));

      // Sort by total points redeemed (descending)
      result.sort((a, b) => b.total_points_redeemed - a.total_points_redeemed);

      return res.json(result);
    }

    // Detailed view - return all transactions with full details
    const detailed = filteredTransactions.map(({ transaction, catalogItem }) => ({
      id: transaction.id,
      driver_username: transaction.driver_username,
      sponsor_username: catalogItem.sponsor_username,
      item_title: catalogItem.title,
      points_redeemed: Math.abs(transaction.points),
      organization_id: transaction.organization_id,
      date: transaction.created_at,
    }));

    res.json(detailed);
  } catch (err) {
    console.error("Error generating sales by driver report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// GET /api/reports/invoices - Generate invoices for sponsors
router.get("/invoices", async (req, res) => {
  try {
    const { sponsor_username, startDate, endDate } = req.query;
    
    // Fee calculation: 10% of points redeemed (can be made configurable)
    const FEE_RATE = 0.10; // 10% fee on points redeemed

    // Build where clause for redemption transactions
    const transactionWhere = {
      type: "redeem",
      item_id: { [Op.ne]: null },
    };

    // Filter by date range if specified
    if (startDate || endDate) {
      transactionWhere.created_at = {};
      if (startDate) {
        transactionWhere.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        transactionWhere.created_at[Op.lte] = end;
      }
    }

    // Get all redemption transactions
    const transactions = await PointsTransaction.findAll({
      where: transactionWhere,
      order: [["created_at", "DESC"]],
    });

    // Get all item_ids to fetch catalog items
    const itemIds = transactions
      .map((t) => t.item_id)
      .filter((id) => id !== null);

    if (itemIds.length === 0) {
      return res.json([]);
    }

    // Fetch catalog items
    const catalogItems = await OrganizationCatalog.findAll({
      where: {
        id: { [Op.in]: itemIds },
      },
      attributes: ["id", "sponsor_username", "title", "points_cost"],
    });

    // Create a map for quick lookup
    const catalogMap = {};
    for (const item of catalogItems) {
      catalogMap[item.id] = item;
    }

    // Combine transactions with catalog items and filter by sponsor if needed
    const transactionsWithCatalog = transactions
      .map((transaction) => {
        const catalogItem = catalogMap[transaction.item_id];
        if (!catalogItem) return null;
        
        return {
          transaction,
          catalogItem,
        };
      })
      .filter((item) => item !== null);

    // Filter by sponsor if specified
    let filteredTransactions = transactionsWithCatalog;
    if (sponsor_username && sponsor_username !== "all") {
      filteredTransactions = transactionsWithCatalog.filter(
        (t) => t.catalogItem.sponsor_username === sponsor_username
      );
    }

    // Group by sponsor, then by driver
    const invoicesBySponsor = {};

    for (const { transaction, catalogItem } of filteredTransactions) {
      const sponsor = catalogItem.sponsor_username;
      const driver = transaction.driver_username;
      const pointsRedeemed = Math.abs(transaction.points);
      const fee = pointsRedeemed * FEE_RATE;

      // Initialize sponsor if not exists
      if (!invoicesBySponsor[sponsor]) {
        invoicesBySponsor[sponsor] = {
          sponsor_username: sponsor,
          startDate: startDate || null,
          endDate: endDate || null,
          drivers: {},
          totalFee: 0,
          totalPointsRedeemed: 0,
          totalRedemptions: 0,
        };
      }

      // Initialize driver if not exists
      if (!invoicesBySponsor[sponsor].drivers[driver]) {
        invoicesBySponsor[sponsor].drivers[driver] = {
          driver_username: driver,
          pointsRedeemed: 0,
          redemptions: 0,
          fee: 0,
          transactions: [],
        };
      }

      // Add transaction data
      invoicesBySponsor[sponsor].drivers[driver].pointsRedeemed += pointsRedeemed;
      invoicesBySponsor[sponsor].drivers[driver].redemptions += 1;
      invoicesBySponsor[sponsor].drivers[driver].fee += fee;
      invoicesBySponsor[sponsor].drivers[driver].transactions.push({
        id: transaction.id,
        item_title: catalogItem.title,
        points_redeemed: pointsRedeemed,
        fee: fee,
        date: transaction.created_at,
      });

      // Update sponsor totals
      invoicesBySponsor[sponsor].totalPointsRedeemed += pointsRedeemed;
      invoicesBySponsor[sponsor].totalRedemptions += 1;
      invoicesBySponsor[sponsor].totalFee += fee;
    }

    // Convert to array format
    const invoices = Object.values(invoicesBySponsor).map((invoice) => ({
      ...invoice,
      drivers: Object.values(invoice.drivers).map((driver) => ({
        ...driver,
        // Remove transactions array for summary (can be included if needed)
        transactions: driver.transactions,
      })),
    }));

    res.json(invoices);
  } catch (err) {
    console.error("Error generating invoices:", err);
    res.status(500).json({ error: "Failed to generate invoices" });
  }
});

// GET /api/reports/audit-logs - Get audit logs
router.get("/audit-logs", async (req, res) => {
  try {
    const { event_type, startDate, endDate } = req.query;

    // Build where clause
    const where = {};

    // Filter by event type if specified
    if (event_type && event_type !== "all") {
      where.event_type = event_type;
    }

    // Filter by date range if specified
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date[Op.lte] = end;
      }
    }

    // Get audit logs
    const logs = await AuditLog.findAll({
      where,
      order: [["date", "DESC"]],
      limit: 1000, // Limit to prevent huge responses
    });

    // For password changes, fetch user roles to include in response
    const logsWithRoles = await Promise.all(logs.map(async (log) => {
      if (log.event_type === "password_change" && log.username) {
        try {
          const User = (await import("../models/User.js")).default;
          const user = await User.findByPk(log.username);
          if (user) {
            return {
              ...log.toJSON(),
              user_role: user.role, // Add role to the log
            };
          }
        } catch (err) {
          console.error("Error fetching user role for audit log:", err);
        }
      }
      return log.toJSON();
    }));

    res.json(logsWithRoles);
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;