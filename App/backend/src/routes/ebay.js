import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Reusable token (you can cache it in memory for 2 hours)
let ebayToken = null;
let tokenExpiry = 0;

async function getEbayToken() {
  const now = Date.now();
  if (ebayToken && now < tokenExpiry) return ebayToken;

  const auth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${auth}`
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope"
  });

  const data = await res.json();
  ebayToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  return ebayToken;
}

router.get("/catalog", async (req, res) => {
  try {
    const token = await getEbayToken();
    const searchTerm = req.query.q || "truck parts";

    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();
    res.json(data.itemSummaries || []);
  } catch (err) {
    console.error("eBay catalog fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch eBay catalog" });
  }
});

export default router;
