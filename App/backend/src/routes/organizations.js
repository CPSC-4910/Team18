// App/backend/src/routes/organizations.js
import express from "express";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import sequelize from "../config/database.js";



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

    // Prevent duplicate names
    const existing = await Organization.findOne({ where: { name } });
    if (existing)
      return res.status(400).json({ error: "Organization name already exists." });

    // Create org
    const org = await Organization.create({ name, created_by: username });

    // Link the sponsor as the owner
    await SponsorOrganizationLink.create({
    sponsor_username: username,
    organization_id: org.id,
    role: "owner",
    });
    
    user.organization_id = org.id;
    await user.save();

    console.log(`[ORG CREATE] ${username} linked to org ${org.name}`);
    return res.status(201).json({ message: "Organization created.", organization: org });
  } catch (err) {
    console.error("[ORG CREATE] error:", err);
    return res.status(500).json({ error: "Server error creating organization." });
  }
});

// Fetch org by user
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

// GET /api/organizations/by-creator/:username
// Returns all organizations created by this sponsor
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

// GET /api/organizations/all — return all organizations for dropdown selection
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


// GET /api/organizations/by-sponsor/:username
router.get("/by-sponsor/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Find all organizations linked to this sponsor
    const links = await SponsorOrganizationLink.findAll({
      where: { sponsor_username: username },
      include: [
        {
          model: Organization,
          attributes: ["id", "name", "status", "created_at"],
        },
      ],
      order: [["is_active", "DESC"], ["joined_at", "ASC"]], // active first, then oldest join
    });

    // If no orgs found
    if (!links.length) {
      return res.json([]);
    }

    // Extract clean organization list
    const orgs = links.map((l) => ({
      id: l.Organization.id,
      name: l.Organization.name,
      status: l.Organization.status,
      created_at: l.Organization.created_at,
      is_active: l.is_active,
    }));

    console.log(`[ORG GET BY SPONSOR] ${username} → ${orgs.length} orgs`);
    res.json(orgs);
  } catch (error) {
    console.error("[ORG GET BY SPONSOR] Error:", error);
    res.status(500).json({ error: "Failed to fetch organizations." });
  }
});


// PATCH /api/organizations/set-active
router.patch("/set-active", async (req, res) => {
  try {
    const { username, organization_id } = req.body;
    if (!username || !organization_id) {
      return res.status(400).json({ error: "Missing username or organization_id" });
    }

    // Check if sponsor already linked
    let link = await SponsorOrganizationLink.findOne({
      where: { sponsor_username: username, organization_id },
    });

    // If not linked yet, create link automatically
    if (!link) {
      link = await SponsorOrganizationLink.create({
        sponsor_username: username,
        organization_id,
        role: "member",
        is_active: false,
      });
      console.log(`[ORG LINK CREATED] ${username} → org ${organization_id}`);
    }

    // Deactivate all orgs for this sponsor
    await SponsorOrganizationLink.update(
      { is_active: false },
      { where: { sponsor_username: username } }
    );

    // Activate chosen one
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


// POST /api/organizations/catalog/add
router.post("/catalog/add", async (req, res) => {
  try {
    const { organization_id, sponsor_username, item } = req.body;

    if (!organization_id || !sponsor_username || !item?.itemId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newItem = await OrganizationCatalog.create({
      organization_id,
      sponsor_username,
      item_id: item.itemId,
      title: item.title,
      price: item.price?.value,
      currency: item.price?.currency,
      image_url: item.image?.imageUrl,
      item_url: item.itemWebUrl,
    });

    res.json({ message: "Item added to catalog.", newItem });
  } catch (err) {
    console.error("[ORG CATALOG ADD] Error:", err);
    res.status(500).json({ error: "Failed to add item to catalog." });
  }
});


// GET /api/organizations/catalog/:organization_id
router.get("/catalog/:organization_id", async (req, res) => {
  try {
    const { organization_id } = req.params;
    const items = await OrganizationCatalog.findAll({
      where: { organization_id },
      order: [["created_at", "DESC"]],
    });
    res.json(items);
  } catch (err) {
    console.error("[ORG CATALOG GET] Error:", err);
    res.status(500).json({ error: "Failed to load organization catalog." });
  }
});

// DELETE /api/organizations/catalog/:id
router.delete("/catalog/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await OrganizationCatalog.destroy({ where: { id } });
    res.json({ message: "Item removed from catalog." });
  } catch (err) {
    console.error("[ORG CATALOG DELETE] Error:", err);
    res.status(500).json({ error: "Failed to remove item from catalog." });
  }
});





export default router;
