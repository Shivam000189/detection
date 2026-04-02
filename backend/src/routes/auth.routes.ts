import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  getUserById,
  updateUser
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", protect, authorizeRoles("admin"), getUsers);
router.get("/auth/me", protect, getUser);
router.get('/users/:id', protect, authorizeRoles("admin"), getUserById);
router.patch('/user/:id', protect, authorizeRoles("admin"), updateUser);

export default router;