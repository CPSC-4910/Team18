import express from "express";
import Organization from "../models/Organization.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";

const router = express.Router();

// GET organizations for a sponsor
router.get("/by-sponsor/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const links = await SponsorOrganizationLink.findAll({
      where: { sponsor_username: username },
      include: [{ model: Organization, as: "organization" }],
    });
    
    // Map the link to include the organization details and the is_active flag
    const orgs = links.map(link => ({
      ...link.organization.toJSON(), // Spread organization details
      is_active: link.is_active,     // Add the is_active flag
      link_role: link.role
    }));

    res.json(orgs);
  } catch (err) {
    console.error("Error fetching sponsor organizations:", err);
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

// GET a specific organization's catalog
router.get("/catalog/:orgId", async (req, res) => {
  try {
    const catalog = await OrganizationCatalog.findAll({
      where: { organization_id: req.params.orgId },
      
      // ▼▼▼ THIS IS THE FIX ▼▼▼
      order: [["created_at", "DESC"]], // Was "D", now "DESC"
      // ▲▲▲ THIS IS THE FIX ▲▲▲

    });
    res.json(catalog);
  } catch (err) {
    console.error("Error fetching catalog:", err);
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

// POST add an item to a catalog
router.post("/catalog/add", async (req, res) => {
  try {
    const { organization_id, sponsor_username, item, points_cost } = req.body;

    // Safely access nested properties
    const price = item.price?.value || null;
    const currency = item.price?.currency || null;
    const image_url = item.image?.imageUrl || null;

    const newItem = await OrganizationCatalog.create({
      organization_id,
      sponsor_username,
      item_id: item.itemId,
      title: item.title,
      price: price,
      currency: currency,
      image_url: image_url,
      item_url: item.itemWebUrl,
      points_cost: points_cost,
    });
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Catalog add error:", err);
    res.status(500).json({ error: "Failed to add item to catalog" });
  }
});

// PATCH update points for a catalog item
router.patch("/catalog/:itemId/points", async (req, res) => {
  try {
    const { points_cost } = req.body;
    const item = await OrganizationCatalog.findByPk(req.params.itemId);
    if (!item) return res.status(4404).json({ error: "Item not found" });

    item.points_cost = points_cost;
    await item.save();
    res.json(item);
  } catch (err) {
    console.error("Error updating points:", err);
    res.status(500).json({ error: "Failed to update points" });
  }
});

// DELETE remove an item from a catalog
router.delete("/catalog/:itemId", async (req, res) => {
  try {
    const item = await OrganizationCatalog.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await item.destroy();
    res.json({ message: "Item removed" });
  } catch (err) {
    console.error("Error removing catalog item:", err);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

export default router;