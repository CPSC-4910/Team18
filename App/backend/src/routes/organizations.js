// App/backend/src/routes/organizations.js - UPDATED
import express from "express";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";

const router = express.Router();

// Create new organization
router.post("/", async (req, res) => {
  console.log("[ORG CREATE] hit:", req.body);
  try {
    const { name, username } = req.body;
    if (!name || !username) {
      return res.status(400).json({ error: "Name and username are required." });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found." });
    if (user.role !== "sponsor")
      return res.status(403).json({ error: "Only sponsors can create organizations." });

    const existing = await Organization.findOne({ where: { name } });
    if (existing)
      return res.status(400).json({ error: "Organization name already exists." });

    const org = await Organization.create({ name, created_by: username });

    await SponsorOrganizationLink.create({
      sponsor_username: username,
      organization_id: org.id,
      role: "owner",
      is_active: true,
    });

    console.log(`[ORG CREATE] ${username} created and linked to org ${org.name}`);
    return res.status(201).json({ message: "Organization created.", organization: org });
  } catch (err) {
    console.error("[ORG CREATE] error:", err);
    return res.status(500).json({ error: "Server error creating organization." });
  }
});

// Get org by user
router.get("/by-user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found." });
    if (!user.organization_id)
      return res.status(404).json({ error: "User not linked to an organization." });

    const org = await Organization.findOne({ where: { id: user.organization_id } });
    if (!org) return res.status(404).json({ error: "Organization not found." });

    res.json(org);
  } catch (err) {
    console.error("[ORG GET] error:", err);
    res.status(500).json({ error: "Server error fetching organization." });
  }
});

// Get all organizations by creator
router.get("/by-creator/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const orgs = await Organization.findAll({ where: { created_by: username } });

    if (!orgs.length) {
      return res.status(404).json({ error: "No organizations found for this sponsor." });
    }

    res.json(orgs);
  } catch (error) {
    console.error("[ORG GET ALL] Error fetching organizations:", error);
    res.status(500).json({ error: "Internal server error fetching organizations." });
  }
});

// Get all organizations
router.get("/all", async (req, res) => {
  try {
    const orgs = await Organization.findAll({
      attributes: ["id", "name", "status", "created_at"],
      order: [["name", "ASC"]],
    });
    res.json(orgs);
  } catch (error) {
    console.error("[ORG GET ALL] Error:", error);
    res.status(500).json({ error: "Failed to load organizations." });
  }
});

// Get organizations by sponsor
router.get("/by-sponsor/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const links = await SponsorOrganizationLink.findAll({
      where: { sponsor_username: username },
      include: [
        {
          model: Organization,
          as: "organization",
          attributes: ["id", "name", "status", "created_at"],
        },
      ],
      order: [["is_active", "DESC"], ["joined_at", "ASC"]],
    });

    if (!links.length) {
      return res.json([]);
    }

    const orgs = links.map((l) => ({
      id: l.organization.id,
      name: l.organization.name,
      status: l.organization.status,
      created_at: l.organization.created_at,
      is_active: l.is_active,
    }));

    console.log(`[ORG GET BY SPONSOR] ${username} → ${orgs.length} orgs`);
    res.json(orgs);
  } catch (error) {
    console.error("[ORG GET BY SPONSOR] Error:", error);
    res.status(500).json({ error: "Failed to fetch organizations." });
  }
});

// Set active organization
router.patch("/set-active", async (req, res) => {
  try {
    const { username, organization_id } = req.body;
    if (!username || !organization_id) {
      return res.status(400).json({ error: "Missing username or organization_id" });
    }

    let link = await SponsorOrganizationLink.findOne({
      where: { sponsor_username: username, organization_id },
    });

    if (!link) {
      link = await SponsorOrganizationLink.create({
        sponsor_username: username,
        organization_id,
        role: "member",
        is_active: false,
      });
      console.log(`[ORG LINK CREATED] ${username} → org ${organization_id}`);
    }

    await SponsorOrganizationLink.update(
      { is_active: false },
      { where: { sponsor_username: username } }
    );

    await SponsorOrganizationLink.update(
      { is_active: true },
      { where: { sponsor_username: username, organization_id } }
    );

    console.log(`[ORG ACTIVE] ${username} → org ${organization_id}`);
    res.json({ message: "Active organization set successfully." });
  } catch (error) {
    console.error("[ORG SET ACTIVE] Error:", error);
    res.status(500).json({ error: "Internal server error setting active organization." });
  }
});

// ✅ FIXED: Add item to catalog
router.post("/catalog/add", async (req, res) => {
  try {
    const { organization_id, sponsor_username, item, points_cost } = req.body;

    console.log("[CATALOG ADD] Request body:", JSON.stringify(req.body, null, 2));

    if (!organization_id || !sponsor_username || !item) {
      console.log("[CATALOG ADD] Missing fields");
      return res.status(400).json({ error: "Missing required fields: organization_id, sponsor_username, or item" });
    }

    if (!item.itemId) {
      console.log("[CATALOG ADD] Missing itemId");
      return res.status(400).json({ error: "Item must have an itemId" });
    }

    // Check if item already exists
    const existing = await OrganizationCatalog.findOne({
      where: { 
        organization_id, 
        item_id: item.itemId 
      }
    });

    if (existing) {
      console.log("[CATALOG ADD] Item already exists:", item.itemId);
      return res.status(409).json({ error: "Item already in catalog" });
    }

    // Create the catalog item
    const newItem = await OrganizationCatalog.create({
      organization_id: parseInt(organization_id),
      sponsor_username,
      item_id: item.itemId,
      title: item.title || "Untitled Item",
      price: parseFloat(item.price?.value) || 0,
      currency: item.price?.currency || "USD",
      image_url: item.image?.imageUrl || "",
      item_url: item.itemWebUrl || "",
      points_cost: parseInt(points_cost) || 0,
      stock_status: "available",
    });

    console.log("[CATALOG ADD] Success! Created item:", newItem.id);
    res.json({ 
      message: "Item added to catalog successfully", 
      item: newItem 
    });
  } catch (err) {
    console.error("[CATALOG ADD] Error:", err);
    console.error("[CATALOG ADD] Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to add item to catalog",
      details: err.message 
    });
  }
});

// Get catalog items
router.get("/catalog/:organization_id", async (req, res) => {
  try {
    const { organization_id } = req.params;
    const items = await OrganizationCatalog.findAll({
      where: { organization_id },
      order: [["created_at", "DESC"]],
    });
    res.json(items);
  } catch (err) {
    console.error("[CATALOG GET] Error:", err);
    res.status(500).json({ error: "Failed to load organization catalog" });
  }
});

// Update catalog item points cost
router.patch("/catalog/:id/points", async (req, res) => {
  try {
    const { id } = req.params;
    const { points_cost } = req.body;

    if (points_cost === undefined || points_cost < 0) {
      return res.status(400).json({ error: "Invalid points cost" });
    }

    const item = await OrganizationCatalog.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    item.points_cost = points_cost;
    await item.save();

    res.json({ message: "Points cost updated", item });
  } catch (err) {
    console.error("[CATALOG UPDATE POINTS] Error:", err);
    res.status(500).json({ error: "Failed to update points cost" });
  }
});

// Delete catalog item
router.delete("/catalog/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OrganizationCatalog.destroy({ where: { id } });
    
    if (deleted === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json({ message: "Item removed from catalog" });
  } catch (err) {
    console.error("[CATALOG DELETE] Error:", err);
    res.status(500).json({ error: "Failed to remove item from catalog" });
  }
});

export default router;