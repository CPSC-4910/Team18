import express from "express";
import Organization from "../models/Organization.js";
import OrganizationCatalog from "../models/OrganizationCatalog.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import DriverOrganizationLink from "../models/DriverOrganizationLink.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

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

// POST /api/organizations/bulk-upload - Bulk upload organizations, drivers, and sponsors
router.post("/bulk-upload", async (req, res) => {
  try {
    const { fileContent, adminUsername } = req.body;

    if (!fileContent) {
      return res.status(400).json({ error: "File content is required" });
    }

    const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    const results = {
      success: [],
      errors: [],
      organizationsCreated: 0,
      driversCreated: 0,
      sponsorsCreated: 0,
    };

    // Track organizations created in this upload session
    const createdOrganizations = new Map();

    // Helper function to get or create organization
    const getOrCreateOrganization = async (orgName) => {
      // Check if we created it in this session
      if (createdOrganizations.has(orgName)) {
        return createdOrganizations.get(orgName);
      }

      // Check if it exists in database
      let org = await Organization.findOne({ where: { name: orgName } });
      
      if (!org) {
        // Organization doesn't exist - this is an error
        return null;
      }

      return org;
    };

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const line = lines[i].trim();

      if (!line) continue;

      // Check if line contains pipe delimiter
      if (!line.includes("|")) {
        results.errors.push({
          line: lineNumber,
          content: line,
          error: "Line does not contain pipe delimiter"
        });
        continue;
      }

      const parts = line.split("|").map(part => part.trim());
      const type = parts[0];

      // Validate type
      if (!["O", "D", "S"].includes(type)) {
        results.errors.push({
          line: lineNumber,
          content: line,
          error: `Invalid type '${type}'. Must be O, D, or S`
        });
        continue;
      }

      try {
        // Process Organization (type O)
        if (type === "O") {
          if (parts.length < 2 || !parts[1]) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: "Organization name is required for type O"
            });
            continue;
          }

          const orgName = parts[1];

          // Check if organization already exists
          const existingOrg = await Organization.findOne({ where: { name: orgName } });
          if (existingOrg) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: `Organization '${orgName}' already exists`
            });
            continue;
          }

          // Create organization
          const newOrg = await Organization.create({
            name: orgName,
            created_by: adminUsername || null,
            status: "active",
            created_at: new Date(),
          });

          createdOrganizations.set(orgName, newOrg);
          results.organizationsCreated++;
          results.success.push({
            line: lineNumber,
            content: line,
            message: `Organization '${orgName}' created successfully`
          });
        }

        // Process Driver (type D)
        else if (type === "D") {
          if (parts.length < 5) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: "Driver record requires: D|organization name|first name|last name|email address"
            });
            continue;
          }

          const orgName = parts[1];
          const firstName = parts[2];
          const lastName = parts[3];
          const email = parts[4];

          // Validate required fields
          if (!orgName || !firstName || !lastName || !email) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: "All fields are required for driver record"
            });
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: `Invalid email format: ${email}`
            });
            continue;
          }

          // Get or create organization
          const org = await getOrCreateOrganization(orgName);
          if (!org) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: `Organization '${orgName}' does not exist. It must exist in the system or be created via an 'O' record earlier in this file.`
            });
            continue;
          }

          // Generate username from first and last name
          const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
          let username = baseUsername;
          let counter = 1;

          // Ensure unique username
          while (await User.findOne({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }

          // Check if email already exists
          const existingUser = await User.findOne({ where: { email } });
          if (existingUser) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: `Email '${email}' already exists`
            });
            continue;
          }

          // Generate default password (first name + last name + "123")
          const defaultPassword = `${firstName}${lastName}123`;
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);

          // Create driver user
          const newDriver = await User.create({
            username,
            email,
            password: hashedPassword,
            role: "driver",
            created_at: new Date(),
          });

          // Link driver to organization
          await DriverOrganizationLink.create({
            driver_username: username,
            organization_id: org.id,
            joined_at: new Date(),
          });

          results.driversCreated++;
          results.success.push({
            line: lineNumber,
            content: line,
            message: `Driver '${username}' created and linked to '${orgName}'`
          });
        }

        // Process Sponsor (type S)
        else if (type === "S") {
          if (parts.length < 5) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: "Sponsor record requires: S|organization name|first name|last name|email address"
            });
            continue;
          }

          const orgName = parts[1];
          const firstName = parts[2];
          const lastName = parts[3];
          const email = parts[4];

          // Validate required fields
          if (!orgName || !firstName || !lastName || !email) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: "All fields are required for sponsor record"
            });
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: `Invalid email format: ${email}`
            });
            continue;
          }

          // Get or create organization
          const org = await getOrCreateOrganization(orgName);
          if (!org) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: `Organization '${orgName}' does not exist. It must exist in the system or be created via an 'O' record earlier in this file.`
            });
            continue;
          }

          // Generate username from first and last name
          const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
          let username = baseUsername;
          let counter = 1;

          // Ensure unique username
          while (await User.findOne({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }

          // Check if email already exists
          const existingUser = await User.findOne({ where: { email } });
          if (existingUser) {
            results.errors.push({
              line: lineNumber,
              content: line,
              error: `Email '${email}' already exists`
            });
            continue;
          }

          // Generate default password (first name + last name + "123")
          const defaultPassword = `${firstName}${lastName}123`;
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);

          // Create sponsor user
          const newSponsor = await User.create({
            username,
            email,
            password: hashedPassword,
            role: "sponsor",
            created_at: new Date(),
          });

          // Link sponsor to organization
          // Deactivate all other organizations for this sponsor first
          await SponsorOrganizationLink.update(
            { is_active: false },
            { where: { sponsor_username: username } }
          );

          await SponsorOrganizationLink.create({
            sponsor_username: username,
            organization_id: org.id,
            role: "member",
            is_active: true,
            joined_at: new Date(),
          });

          results.sponsorsCreated++;
          results.success.push({
            line: lineNumber,
            content: line,
            message: `Sponsor '${username}' created and linked to '${orgName}'`
          });
        }
      } catch (err) {
        console.error(`Error processing line ${lineNumber}:`, err);
        results.errors.push({
          line: lineNumber,
          content: line,
          error: err.message || "Unknown error processing line"
        });
      }
    }

    res.json({
      message: "Bulk upload completed",
      summary: {
        totalLines: lines.length,
        organizationsCreated: results.organizationsCreated,
        driversCreated: results.driversCreated,
        sponsorsCreated: results.sponsorsCreated,
        successCount: results.success.length,
        errorCount: results.errors.length,
      },
      results,
    });
  } catch (err) {
    console.error("Error processing bulk upload:", err);
    res.status(500).json({ error: "Failed to process bulk upload", details: err.message });
  }
});


export default router;