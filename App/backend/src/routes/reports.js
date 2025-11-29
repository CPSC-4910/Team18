// In backend/src/routes/reports.js (create this file)
import express from "express";
import PointsTransaction from "../models/PointsTransaction.js";
import PointsBalance from "../models/PointsBalance.js";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
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

export default router;