import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { CreateOrderInput } from "../types/order.types.js";
import { emitSocketEvent } from "../utils/socket-notification.js";

export const createOrder = async (userId: number, data: CreateOrderInput) => {

    const { items } = data;

    // Merge duplicate menu item IDs
    const mergedItems = new Map<number, number>();

    for (const item of items) {

        const existingQuantity = mergedItems.get(item.menuItemId) ?? 0;

        const newQuantity = existingQuantity + item.quantity;

        if (newQuantity > 20) {
            throw new AppError(`Maximum quantity for menu item ${item.menuItemId} is 20`, 400);
        }

        mergedItems.set(item.menuItemId, newQuantity);
    }

    const normalizedItems = Array.from(mergedItems.entries()).map(([menuItemId, quantity]) => ({ menuItemId, quantity, }));

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

    // console.log(menuItemIds, 'menuItemIds')
    // console.log(menuItems, 'menuItems')

    if (menuItems.length !== menuItemIds.length) {
        throw new AppError("One or more menu items are unavailable", 400);
    }

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    let totalAmount = 0;

    const orderItems = normalizedItems.map((item) => {

        const menuItem = menuItemMap.get(item.menuItemId);

        if (!menuItem) {
            throw new AppError(`Menu item ${item.menuItemId} not found`, 404);
        }

        const price = Number(menuItem.price);

        totalAmount += price * item.quantity;

        return {
            menuItemId: menuItem.id,
            quantity: item.quantity,
            price: menuItem.price,
        };
    });

    const order = await prisma.$transaction(

        async (tx) => {

            const createdOrder = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: {
                        include: {
                            menuItem: true,
                        },
                    },
                },
            });

            return createdOrder;
        }
    );

    const admin = await prisma.user.findFirst({
        where: {
            role: "RESTAURANT_ADMIN",
        },
        select: {
            id: true,
        },
    });

    if (admin) {
        emitSocketEvent(`user:${admin.id}`, "order:new", {
            orderId: order.id,
        });
    }

    return order;
};


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
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    return order;
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
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        itemCount: order._count.items,
    }));
};