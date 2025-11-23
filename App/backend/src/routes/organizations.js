import express from "express";
import Organization from "../models/Organization.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";

const router = express.Router();

// GET organizations for a sponsor
router.get("/by-sponsor/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching organizations for sponsor: ${username}`);
    
    const links = await SponsorOrganizationLink.findAll({
      where: { sponsor_username: username },
      include: [{ model: Organization, as: "organization" }],
    });
    
    console.log(`Found ${links.length} links for sponsor ${username}`);
    
    // Filter out links with null organizations and map to include organization details
    const orgs = links
      .filter(link => link.organization !== null) // Filter out null organizations
      .map(link => ({
        ...link.organization.toJSON(), // Spread organization details
        is_active: link.is_active,     // Add the is_active flag
        link_role: link.role
      }));

    console.log(`Returning ${orgs.length} organizations for sponsor ${username}`);
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

router.patch("/set-active/:orgId", async (req, res) => {
  try {
    const { sponsor_username } = req.body;
    const { orgId } = req.params;

    if (!sponsor_username) {
      return res.status(400).json({ error: "sponsor_username is required" });
    }

    // First, deactivate all organizations for this sponsor
    await SponsorOrganizationLink.update(
      { is_active: false },
      { where: { sponsor_username } }
    );

    // Then activate the selected one
    const [updatedRows] = await SponsorOrganizationLink.update(
      { is_active: true },
      { 
        where: { 
          sponsor_username,
          organization_id: orgId 
        } 
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ 
        error: "Organization link not found for this sponsor" 
      });
    }

    res.json({ message: "Active organization updated successfully" });
  } catch (err) {
    console.error("Error setting active organization:", err);
    res.status(500).json({ error: "Failed to set active organization" });
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

// GET all organizations (for driver application page)
router.get("/all", async (req, res) => {
  try {
    const orgs = await Organization.findAll({
      attributes: ["id", "name", "created_by", "status", "created_at"],
      order: [["name", "ASC"]],
    });

    res.json(orgs);
  } catch (err) {
    console.error("Error loading organizations:", err);
    res.status(500).json({ error: "Failed to load organizations" });
  }
});

// POST sponsor join organization
router.post("/join", async (req, res) => {
  try {
    const { sponsor_username, organization_id } = req.body;

    if (!sponsor_username || !organization_id) {
      return res.status(400).json({ error: "sponsor_username and organization_id are required" });
    }

    // Verify organization exists
    const organization = await Organization.findByPk(organization_id);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Check if link already exists
    const existingLink = await SponsorOrganizationLink.findOne({
      where: {
        sponsor_username,
        organization_id,
      },
    });

    if (existingLink) {
      // If link exists, just set it as active
      await SponsorOrganizationLink.update(
        { is_active: false },
        { where: { sponsor_username } }
      );
      await existingLink.update({ is_active: true });
      return res.json({ message: "Organization activated successfully" });
    }

    // Deactivate all other organizations for this sponsor
    await SponsorOrganizationLink.update(
      { is_active: false },
      { where: { sponsor_username } }
    );

    // Create new link and set as active
    const newLink = await SponsorOrganizationLink.create({
      sponsor_username,
      organization_id,
      role: "member",
      is_active: true,
    });

    res.status(201).json({ message: "Successfully joined organization", link: newLink });
  } catch (err) {
    console.error("Error joining organization:", err);
    res.status(500).json({ error: "Failed to join organization" });
  }
});


export default router;