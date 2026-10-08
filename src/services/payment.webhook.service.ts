import Stripe from "stripe";
import { prisma } from "../config/prisma.js";

export const handleStripeWebhook = async (event: Stripe.Event) => {

    switch (event.type) {

        case "payment_intent.succeeded": {

            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            const orderId = Number(paymentIntent.metadata.orderId);

            if (!orderId) {
                throw new Error(
                    "Order ID missing from PaymentIntent metadata"
                );
            }

            await prisma.order.update({
                where: {
                    id: orderId,
                },
                data: {
                    paymentStatus: "PAID",
                },
            });

            break;
        }

        case "payment_intent.payment_failed": {

            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            const orderId = Number(paymentIntent.metadata.orderId);

            if (!orderId) {
                break;
            }

            await prisma.order.update({
                where: {
                    id: orderId,
                },
                data: {
                    paymentStatus: "FAILED",
                },
            });

            break;
        }

        case "refund.created": {

            const refund = event.data.object as Stripe.Refund;

            const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
            
            if (!paymentIntentId) {
                break;
            }

            await prisma.order.update({
                where: {
                    stripePaymentIntentId: paymentIntentId,
                },
                data: {
                    paymentStatus: "REFUNDED",
                    stripeRefundId: refund.id,
                },
            });

            break;
        }

        default:
            break;
    }
};