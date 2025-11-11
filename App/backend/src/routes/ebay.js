// backend/src/routes/ebay.js - FIXED VERSION
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
  if (ebayToken && now < tokenExpiry) {
    console.log("Using cached eBay token");
    return ebayToken;
  }

  console.log("Fetching new eBay token...");
  
  // Check if credentials exist
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    console.error("❌ eBay credentials missing in environment variables");
    throw new Error("eBay API credentials not configured");
  }

  const auth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64");
  
  try {
    const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope"
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("eBay token fetch failed:", res.status, errorText);
      throw new Error(`Failed to get eBay token: ${res.status}`);
    }

    const data = await res.json();
    ebayToken = data.access_token;
    tokenExpiry = now + (data.expires_in * 1000) - 60000; // Refresh 1 min early
    
    console.log("✅ eBay token obtained successfully");
    return ebayToken;
  } catch (err) {
    console.error("Error fetching eBay token:", err);
    throw err;
  }
}

// GET /api/ebay/catalog - Search eBay products
router.get("/catalog", async (req, res) => {
  try {
    const searchTerm = req.query.q || "truck parts";
    console.log(`🔍 Searching eBay for: "${searchTerm}"`);

    const token = await getEbayToken();

    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&limit=20`,
      {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("eBay search failed:", response.status, errorText);
      return res.status(response.status).json({ 
        error: "eBay search failed",
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Check if we got results
    if (!data.itemSummaries || data.itemSummaries.length === 0) {
      console.log("⚠️ No results found for search term");
      return res.json([]);
    }

    console.log(`✅ Found ${data.itemSummaries.length} items`);
    res.json(data.itemSummaries);
    
  } catch (err) {
    console.error("eBay catalog fetch error:", err);
    res.status(500).json({ 
      error: "Failed to fetch eBay catalog",
      message: err.message 
    });
  }
});

// GET /api/ebay/test - Test endpoint to verify eBay API is working
router.get("/test", async (req, res) => {
  try {
    const hasCredentials = !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
    
    if (!hasCredentials) {
      return res.json({
        status: "error",
        message: "eBay credentials not configured",
        hasClientId: !!process.env.EBAY_CLIENT_ID,
        hasClientSecret: !!process.env.EBAY_CLIENT_SECRET
      });
    }

    const token = await getEbayToken();
    
    res.json({
      status: "success",
      message: "eBay API connection successful",
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});

export default router;