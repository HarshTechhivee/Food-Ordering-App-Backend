import { Router } from "express";
import { getAllOrders, updateOrderStatus } from "../controllers/adminOrder.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {validate} from "../middleware/validate.middleware.js";
import {  adminOrderIdSchema,  updateOrderStatusSchema,} from "../validations/adminOrder.schema.js";

const router = Router();

router.get("/", authenticate, requireRole("RESTAURANT_ADMIN"), asyncHandler(getAllOrders));

router.patch(
  "/:id/status",
  authenticate,
  requireRole("RESTAURANT_ADMIN"),
  validate(adminOrderIdSchema, "params"),
  validate(updateOrderStatusSchema, "body"),
  asyncHandler(updateOrderStatus)
);

export default router;