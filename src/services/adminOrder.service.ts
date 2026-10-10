import { prisma } from "../config/prisma.js";
import type { UpdateOrderStatusInput } from "../types/order.types.js";
import { AppError } from "../utils/AppError.js";
import { emitSocketEvent } from "../utils/socket-notification.js";
import { refundOrderPayment } from "./payment.service.js";

export const getAllOrders = async () => {

    const orders = await prisma.order.findMany({
        orderBy: {
            createdAt: "desc",
        },

        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },

            _count: {
                select: {
                    items: true,
                },
            },
        },
    });

    return orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        itemCount: order._count.items,
        rejectionReason: order.rejectionReason,
        cancellationReason: order.cancellationReason,
        user: order.user,
    }));
};


export const updateOrderStatus = async (orderId: number, data: UpdateOrderStatusInput) => {

    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    const currentStatus = order.status;

    const newStatus = data.status;

    const allowedTransitions: Record<string, string[]> = {
        PENDING: ["APPROVED", "REJECTED"],
        APPROVED: ["OUT_FOR_DELIVERY"],
        OUT_FOR_DELIVERY: ["DELIVERED"],
        DELIVERED: [],
        REJECTED: [],
    };

    const allowedStatuses = allowedTransitions[currentStatus] ?? [];

    if (!allowedStatuses.includes(newStatus)) {
        throw new AppError(`Order cannot move from ${currentStatus} to ${newStatus}`, 400);
    }

    const updatedOrder = await prisma.order.update({
        where: {
            id: orderId,
        },
        data: {
            status: newStatus,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            items: {
                include: {
                    menuItem: true,
                },
            },
        },
    });

    console.log("Sending order status notification:", {
        room: `user:${updatedOrder.userId}`,
        orderId: updatedOrder.id,
        status: updatedOrder.status,
    });

    emitSocketEvent(`user:${updatedOrder.userId}`, "order:statusUpdated",
        {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
        }
    );

    return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
        itemCount: updatedOrder.items.length,
        user: updatedOrder.user,
    };
};



export const rejectOrder = async (orderId: number, rejectionReason: string) => {

    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
        select: {
            id: true,
            userId: true,
            status: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
            stripeRefundId: true,
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    if (order.status !== "PENDING") {
        throw new AppError(
            "Only pending orders can be rejected",
            400
        );
    }

    if (order.paymentStatus !== "PAID") {
        throw new AppError(
            "Only paid orders can be rejected",
            400
        );
    }

    if (!rejectionReason.trim()) {
        throw new AppError(
            "Rejection reason is required",
            400
        );
    }

    await refundOrderPayment(order.id);

    const updatedOrder = await prisma.order.update({
        where: {
            id: order.id,
        },
        data: {
            status: "REJECTED",
            paymentStatus: "REFUNDED",
            rejectionReason: rejectionReason.trim(),
        },
    });

    emitSocketEvent(
        `user:${updatedOrder.userId}`,
        "order:rejected",
        {
            orderId: updatedOrder.id,
        }
    );

    return {
        order: updatedOrder,
    };
};
