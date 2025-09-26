// backend/src/server.js
import express from "express";
import cors from "cors";
import sequelize from "./config/database.js";

const app = express();
app.use(cors()); // allows requests from frontend
app.use(express.json());

// API endpoints
app.get("/api", (req, res) => {
  res.send("Backend server is running");
});

app.get("/api/test-db", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.send("Database connection successful");
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).send("Database connection failed");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
