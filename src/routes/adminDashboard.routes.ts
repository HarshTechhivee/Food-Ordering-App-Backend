import { Router } from "express";
import { getDashboard } from "../controllers/adminDashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, requireRole("RESTAURANT_ADMIN"), asyncHandler(getDashboard));

export default router;