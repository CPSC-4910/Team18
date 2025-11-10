import Organization from "../models/organization.js";
import User from "../models/User.js";

/**
 * @desc    Create a new organization
 * @route   POST /api/organizations
 * @access  Private (Sponsors only)
 */
export const createOrganization = async (req, res) => {
  const { name } = req.body;

  // 1. Get the sponsor's username from the auth middleware
  // (Assuming your auth middleware adds the user to req.user)
  const sponsorUsername = req.user.username; 

  if (!name) {
    return res.status(400).json({ message: "Please provide an organization name." });
  }

  try {
    // 2. Check if an organization with this name already exists
    const orgExists = await Organization.findOne({ where: { name } });
    if (orgExists) {
      return res.status(400).json({ message: "An organization with this name already exists." });
    }

    // 3. Create the new organization
    const organization = await Organization.create({
      name,
      sponsor_username: sponsorUsername,
    });

    if (organization) {
      res.status(201).json({
        id: organization.id,
        name: organization.name,
        sponsor: organization.sponsor_username,
      });
    } else {
      res.status(400).json({ message: "Invalid organization data." });
    }
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ message: "Server error" });
  }
};