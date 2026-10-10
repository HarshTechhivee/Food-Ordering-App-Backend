import { Router } from "express";
import { getOrderById, getUserOrders, cancelOrderController } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { cancelOrderSchema, createOrderSchema, orderIdSchema } from "../validations/order.validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// router.post("/", authenticate, validate(createOrderSchema, "body"), asyncHandler(createOrder));

router.get("/", authenticate, asyncHandler(getUserOrders));

router.get("/:id", authenticate, validate(orderIdSchema, "params"), asyncHandler(getOrderById));

router.patch("/:orderId/cancel", authenticate, validate(cancelOrderSchema), cancelOrderController);

export default router;