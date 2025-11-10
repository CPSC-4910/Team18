import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware 1: Checks if user is logged in
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and attach to req object
      // This correctly uses the 'username' from the token payload
      req.user = await User.findByPk(decoded.username, {
        attributes: { exclude: ["password"] },
      });

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next(); // All good, proceed to the route
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware 2: Checks if user is a Sponsor
export const isSponsor = (req, res, next) => {
  if (req.user && req.user.role === 'sponsor') {
    next(); // User is a sponsor, proceed
  } else {
    res.status(403).json({ message: "Access denied. Sponsor role required." });
  }
};

// Middleware 3: NEW - Checks if user is an Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is an admin, proceed
  } else {
    res.status(403).json({ message: "Access denied. Admin role required." });
  }
};