import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { stripeWebhook, getPaymentSessionController } from "../controllers/payment.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPaymentIntentSchema } from "../validations/payment.schema.js";
import { createPayment } from "../services/payment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/webhook", stripeWebhook);

router.get("/orders/:orderId", authenticate, getPaymentSessionController);

router.post("/create-payment-intent", authenticate, validate(createPaymentIntentSchema, "body"), asyncHandler(createPayment))

export default router;