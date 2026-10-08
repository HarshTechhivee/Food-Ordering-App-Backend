import { Router } from "express";
import { getAllOrders, updateOrderStatus, rejectOrderController } from "../controllers/adminOrder.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {validate} from "../middleware/validate.middleware.js";
import {  adminOrderIdSchema,  updateOrderStatusSchema,} from "../validations/adminOrder.schema.js";
import { rejectOrderSchema } from "../validations/order.validation.js";

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

router.patch(
    "/:orderId/reject",
    authenticate,
    requireRole("RESTAURANT_ADMIN"),
    validate(rejectOrderSchema),
    rejectOrderController
);

export default router;