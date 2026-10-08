import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { stripeWebhook, getPaymentSessionController } from "../controllers/payment.controller.js";

const router = Router();

router.post("/webhook", stripeWebhook);

router.get("/orders/:orderId", authenticate, getPaymentSessionController);

export default router;