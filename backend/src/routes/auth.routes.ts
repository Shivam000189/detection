import express from "express";
import { validate } from "../validators/validate.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/auth.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = express.Router();

// AUTH
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/me", protect, getUser);

// ADMIN USERS
router.get("/users", protect, authorize("admin"), getUsers);
router.get("/users/:id", protect, authorize("admin"), getUserById);
router.patch("/users/:id", protect, authorize("admin"), updateUser);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

export default router;