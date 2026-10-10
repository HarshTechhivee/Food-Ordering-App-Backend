import { prisma } from "../config/prisma.js";
import { stripe } from "../config/stripe.js";
import { AppError } from "../utils/AppError.js";
import { RequestHandler } from "express";

export interface CreatePaymentIntentInput {
    userId: number;
    items: {
        menuItemId: number;
        quantity: number;
        price: number;
    }[];
    amount: number;
}


export const createPayment: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { items } = req.validatedBody as {
        items: {
            menuItemId: number;
            quantity: number;
        }[];
    };

    // Merge duplicate menu item IDs
    const mergedItems = new Map<number, number>();

    for (const item of items) {
        const existingQuantity =
            mergedItems.get(item.menuItemId) ?? 0;

        const newQuantity =
            existingQuantity + item.quantity;

        if (newQuantity > 20) {
            throw new AppError(
                `Maximum quantity for menu item ${item.menuItemId} is 20`,
                400
            );
        }

        mergedItems.set(item.menuItemId, newQuantity);
    }

    const normalizedItems = Array.from(mergedItems.entries()).map(([menuItemId, quantity]) => ({
        menuItemId, quantity,
    }));

    const menuItemIds = normalizedItems.map((item) => item.menuItemId);

    const menuItems = await prisma.menuItem.findMany({
        where: {
            id: {
                in: menuItemIds,
            },
            isActive: true,
            isAvailable: true,
        },
    });

    if (menuItems.length !== menuItemIds.length) {
        throw new AppError("One or more menu items are unavailable", 400);
    }

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    let totalAmount = 0;

    const orderItems = normalizedItems.map((item) => {

        const menuItem = menuItemMap.get(item.menuItemId);

        if (!menuItem) {
            throw new AppError(
                `Menu item ${item.menuItemId} not found`,
                404
            );
        }

        const price = Number(menuItem.price);

        totalAmount += price * item.quantity;

        return {
            menuItemId: menuItem.id,
            quantity: item.quantity,
            price,
        };
    });

    const paymentIntent = await createPaymentIntent({
        userId: req.user.userId,
        items: orderItems,
        amount: totalAmount,
    });

    res.status(201).json({
        success: true,
        message: "Payment initiated",
        data: {
            clientSecret: paymentIntent.client_secret,
        },
    });
};


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
                userId: String(data.userId),
                items: JSON.stringify(data.items),
            },
        },
        {
            idempotencyKey: `checkout-${data.userId}-${Date.now()}`,
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