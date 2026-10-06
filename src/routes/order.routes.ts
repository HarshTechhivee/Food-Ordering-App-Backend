import { Router } from "express";

import { createOrder, getOrderById, getUserOrders } from "../controllers/order.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import { createOrderSchema, orderIdSchema } from "../validations/order.validation.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", authenticate, validate(createOrderSchema, "body"), asyncHandler(createOrder));

router.get("/", authenticate, asyncHandler(getUserOrders));

router.get("/:id", authenticate, validate(orderIdSchema, "params"), asyncHandler(getOrderById));

export default router;