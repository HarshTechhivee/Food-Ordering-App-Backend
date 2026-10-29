import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { emitSocketEvent } from "../utils/socket-notification.js";
import { refundOrderPayment } from "./payment.service.js";
import { notifyUser } from "./pushNotification.service.js";
import { getFrontendUrl } from "../utils/frontendUrl.js";
import { getMenuImageUrl } from "./s3MenuImage.service.js";

export const getOrderById = async (orderId: number, userId: number) => {

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
        include: {
            items: {
                include: {
                    menuItem: true,
                },
            },
            review: {
                select: {
                    id: true,
                    orderId: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    const items = await Promise.all(
        order.items.map(async (item) => ({
            ...item,
            menuItem: {
                ...item.menuItem,
                image: await getMenuImageUrl(item.menuItem.image),
            },
        }))
    );

    return {
        ...order,
        items,
    };
};


export const getUserOrders = async (userId: number) => {

    const orders = await prisma.order.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
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
        PaymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        itemCount: order._count.items,
    }));
};



export const cancelOrder = async (orderId: number, userId: number, cancellationReason: string) => {

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    if (order.status !== "PENDING") {
        throw new AppError(
            "Only pending orders can be cancelled",
            400
        );
    }

    if (!cancellationReason.trim()) {
        throw new AppError(
            "Cancellation reason is required",
            400
        );
    }

    if (order.paymentStatus === "PAID") {
        await refundOrderPayment(order.id);
    }

    const updatedOrder = await prisma.order.update({
        where: {
            id: order.id,
        },
        data: {
            status: "CANCELLED",
            cancellationReason: cancellationReason.trim(),
        },
    });

    emitSocketEvent("admin", "order:cancelled", {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
    });

    const admin = await prisma.user.findFirst({
        where: {
            role: "RESTAURANT_ADMIN",
        },
        select: {
            id: true,
        },
    });

    if (admin) {
        void notifyUser(
            admin.id,
            "Order Cancelled!",
            `Customer has cancelled order #${updatedOrder.id}.`,
            getFrontendUrl("/admin/orders")
        ).catch((error: unknown) => {
            console.error("Failed to send order cancellation push notification to admin:", error,);
        });
    }

    return {
        order: updatedOrder,
    };
};
