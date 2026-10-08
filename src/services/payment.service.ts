import { prisma } from "../config/prisma.js";
import { stripe } from "../config/stripe.js";
import { AppError } from "../utils/AppError.js";

interface CreatePaymentIntentInput {
    orderId: number;
    userId: number;
    amount: number;
}

export const createPaymentIntent = async (data: CreatePaymentIntentInput) => {

    const amountInPaise = Math.round(data.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create(
        {
            amount: amountInPaise,
            currency: "inr",

            automatic_payment_methods: {
                enabled: true,
            },

            metadata: {
                orderId: String(data.orderId),
                userId: String(data.userId),
            },
        },
        {
            idempotencyKey: `order-${data.orderId}-payment`,
        }
    );

    return paymentIntent;
};


export const getPaymentSession = async (orderId: number, userId: number) => {

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
        select: {
            id: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    if (!order.stripePaymentIntentId) {
        throw new AppError(
            "Payment session does not exist for this order",
            400
        );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

    return {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        clientSecret: paymentIntent.client_secret,
    };
};


export const refundOrderPayment = async (orderId: number) => {

    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
        select: {
            id: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
            stripeRefundId: true,
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    if (order.paymentStatus !== "PAID") {
        throw new AppError("Only paid orders can be refunded", 400);
    }

    if (!order.stripePaymentIntentId) {
        throw new AppError("Stripe PaymentIntent not found", 400);
    }

    if (order.stripeRefundId) {
        throw new AppError("Order has already been refunded", 400);
    }

    const refund = await stripe.refunds.create(
        {
            payment_intent: order.stripePaymentIntentId,
        },
        {
            idempotencyKey: `order-${order.id}-refund`,
        }
    );

    return refund;
};