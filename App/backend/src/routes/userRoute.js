//Needs test
import express from "express";
import { getUsers, createUser, loginUser } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users → list all users
router.get("/", getUsers);

// POST /api/users → create a new user
router.post("/", createUser);

// POST /api/users/login → login
router.post("/login", loginUser);

export default router;
