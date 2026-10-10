import type { Request, Response } from "express";
import { stripe } from "../config/stripe.js";
import { handleStripeWebhook, } from "../services/payment.webhook.service.js";
import { getPaymentSession } from "../services/payment.service.js";

export const stripeWebhook = async (req: Request, res: Response) => {

    const signature = req.headers["stripe-signature"];

    if (!signature) {
        return res.status(400).json({
            success: false,
            message: "Missing Stripe signature",
        });
    }

    try {

        const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

        await handleStripeWebhook(event);

        return res.status(200).json({
            received: true,
        });

    } catch (error) {

        console.error(
            "Stripe webhook error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: "Invalid Stripe webhook",
        });
    }
};


export const getPaymentSessionController = async (req: Request, res: Response) => {
    
    const orderId = Number(req.params.orderId);
    const userId = req.user!.userId;

    const paymentSession = await getPaymentSession(orderId, userId);

    return res.status(200).json({
        success: true,
        data: paymentSession,
    });
};


