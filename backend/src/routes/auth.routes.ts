import express from "express";
import {
  registerUser,
  loginUser,
  getUsers
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", protect, authorizeRoles("admin"), getUsers);

export default router;