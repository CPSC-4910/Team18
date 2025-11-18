// In backend/src/routes/reports.js (create this file)
import express from "express";
import PointsTransaction from "../models/PointsTransaction.js";

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

export default router;