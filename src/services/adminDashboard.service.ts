import { prisma } from "../config/prisma.js";

export const getDashboardStats = async () => {

    const [totalOrders, pendingOrders, menuItems, orderValue, pendingCount, approvedCount,

        outForDeliveryCount, deliveredCount, rejectedCount, recentOrders,] = await Promise.all([

            prisma.order.count(),

            prisma.order.count({
                where: {
                    status: "PENDING",
                },
            }),

            prisma.menuItem.count({
                where: {
                    isActive: true,
                },
            }),

            prisma.order.aggregate({
                _sum: {
                    totalAmount: true,
                },
                where: {
                    status: {
                        not: "REJECTED",
                    },
                },
            }),

            prisma.order.count({
                where: {
                    status: "PENDING",
                },
            }),

            prisma.order.count({
                where: {
                    status: "APPROVED",
                },
            }),

            prisma.order.count({
                where: {
                    status: "OUT_FOR_DELIVERY",
                },
            }),

            prisma.order.count({
                where: {
                    status: "DELIVERED",
                },
            }),

            prisma.order.count({
                where: {
                    status: "REJECTED",
                },
            }),

            prisma.order.findMany({
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
        ]);

    return {
        totalOrders,
        pendingOrders,
        menuItems,

        totalOrderValue: orderValue._sum.totalAmount ?? 0,

        orderStatus: {
            PENDING: pendingCount,
            APPROVED: approvedCount,
            OUT_FOR_DELIVERY: outForDeliveryCount,
            DELIVERED: deliveredCount,
            REJECTED: rejectedCount,
        },

        recentOrders,
    };
};