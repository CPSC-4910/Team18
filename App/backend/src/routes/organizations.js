// App/backend/src/routes/organizations.js
import express from "express";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import SponsorOrganizationLink from "../models/SponsorOrganizationLink.js";
import SponsorOrganizationInvite from "../models/SponsorOrganizationInvite.js";

import sequelize from "../config/database.js";
import { Op } from "sequelize";


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

// GET /api/organizations/by-sponsor/:username
router.get("/by-sponsor/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const links = await SponsorOrganizationLink.findAll({
      where: { sponsor_username: username },
      include: [
        {
          model: Organization,
          as: "organization", // must match alias from model
          attributes: ["id", "name", "created_by", "created_at"],
        },
      ],
    });

    if (!links.length)
      return res.status(404).json({ error: "No organizations found for this sponsor." });

    const orgs = links.map(link => ({
      id: link.organization.id,
      name: link.organization.name,
      created_by: link.organization.created_by,
      created_at: link.organization.created_at,
      role: link.role,
    }));

    res.json(orgs);
  } catch (error) {
    console.error("[ORG GET BY SPONSOR] Error:", error);
    res.status(500).json({ error: "Internal server error fetching organizations." });
  }
});


// POST /api/organizations/invite-sponsor
router.post("/invite-sponsor", async (req, res) => {
  try {
    const { organization_id, inviter_username, invitee_username } = req.body;

    if (!organization_id || !inviter_username || !invitee_username) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Ensure both inviter and invitee exist
    const inviter = await User.findOne({ where: { username: inviter_username } });
    const invitee = await User.findOne({ where: { username: invitee_username } });

    if (!inviter || !invitee)
      return res.status(404).json({ error: "One or both users not found." });

    if (inviter.role !== "sponsor" || invitee.role !== "sponsor")
      return res.status(403).json({ error: "Only sponsors can send/receive invites." });

    // Ensure inviter is linked to this org
    const orgLink = await SponsorOrganizationLink.findOne({
      where: { sponsor_username: inviter_username, organization_id },
    });

    if (!orgLink)
      return res.status(403).json({ error: "You are not a member of this organization." });

    // Prevent duplicates
    const existingInvite = await SponsorOrganizationInvite.findOne({
      where: { organization_id, invitee_username },
    });
    if (existingInvite)
      return res.status(400).json({ error: "This sponsor is already invited to this organization." });

    // Create the invite
    const invite = await SponsorOrganizationInvite.create({
      organization_id,
      inviter_username,
      invitee_username,
    });

    res.status(201).json({ message: "Invite sent successfully.", invite });
  } catch (error) {
    console.error("[INVITE SPONSOR] Error:", error);
    res.status(500).json({ error: "Server error sending invite." });
  }
});

// PATCH /api/organizations/respond-invite
router.patch("/respond-invite", async (req, res) => {
  try {
    const { invite_id, response } = req.body;

    if (!invite_id || !["accepted", "declined"].includes(response)) {
      return res.status(400).json({ error: "Invalid or missing fields." });
    }

    const invite = await SponsorOrganizationInvite.findByPk(invite_id);
    if (!invite) return res.status(404).json({ error: "Invite not found." });

    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Invite already responded to." });
    }

    // Update invite status
    invite.status = response;
    invite.responded_at = new Date();
    await invite.save();

    if (response === "accepted") {
      // Add the sponsor to the organization
      await SponsorOrganizationLink.create({
        sponsor_username: invite.invitee_username,
        organization_id: invite.organization_id,
        role: "member",
      });
    }

    res.json({ message: `Invite ${response} successfully.` });
  } catch (error) {
    console.error("[RESPOND INVITE] Error:", error);
    res.status(500).json({ error: "Server error responding to invite." });
  }
});

// GET /api/organizations/invites/:username
router.get("/invites/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const invites = await SponsorOrganizationInvite.findAll({
      where: {
        [Op.or]: [
          { inviter_username: username },
          { invitee_username: username },
        ],
      },
      order: [["invited_at", "DESC"]],
    });

    if (!invites.length) {
      return res.json([]); // Empty list
    }

    res.json(invites);
  } catch (error) {
    console.error("[ORG GET INVITES] Error:", error);
    res.status(500).json({ error: "Error fetching invites." });
  }
});


export default router;
