import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { registerPushToken } from "../controllers/notification.controller.js";

const router = Router();

router.post("/push-token", authenticate, asyncHandler(registerPushToken));

export default router;