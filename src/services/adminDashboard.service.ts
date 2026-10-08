import { prisma } from "../config/prisma.js";

export const getDashboardStats = async () => {

    const [
        
        totalOrders, pendingOrders, menuItems, revenue, refundedAmount, paidOrders, totalCustomers,
        pendingCount, approvedCount, outForDeliveryCount, deliveredCount, rejectedCount, cancelledCount, recentOrders,

    ] = await Promise.all([

        // Total orders
        prisma.order.count(),

        // Pending orders
        prisma.order.count({
            where: {
                status: "PENDING",
            },
        }),

        // Active menu items
        prisma.menuItem.count({
            where: {
                isActive: true,
            },
        }),

        // Revenue = currently paid orders
        prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            where: {
                paymentStatus: "PAID",
            },
        }),

        // Total refunded amount
        prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            where: {
                paymentStatus: "REFUNDED",
            },
        }),

        // Paid orders
        prisma.order.count({
            where: {
                paymentStatus: "PAID",
            },
        }),

        // Total customers
        prisma.user.count({
            where: {
                role: "USER",
            },
        }),

        // Pending
        prisma.order.count({
            where: {
                status: "PENDING",
            },
        }),

        // Approved
        prisma.order.count({
            where: {
                status: "APPROVED",
            },
        }),

        // Out for delivery
        prisma.order.count({
            where: {
                status: "OUT_FOR_DELIVERY",
            },
        }),

        // Delivered
        prisma.order.count({
            where: {
                status: "DELIVERED",
            },
        }),

        // Rejected
        prisma.order.count({
            where: {
                status: "REJECTED",
            },
        }),

        // Cancelled
        prisma.order.count({
            where: {
                status: "CANCELLED",
            },
        }),

        // Recent orders
        prisma.order.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
            select: {
                id: true,
                status: true,
                paymentStatus: true,
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

        // Keep existing key, but now it represents actual revenue
        totalOrderValue: revenue._sum.totalAmount ?? 0,

        // New dashboard values
        revenue: revenue._sum.totalAmount ?? 0,
        refundedAmount: refundedAmount._sum.totalAmount ?? 0,
        paidOrders,
        totalCustomers,

        orderStatus: {
            PENDING: pendingCount,
            APPROVED: approvedCount,
            OUT_FOR_DELIVERY: outForDeliveryCount,
            DELIVERED: deliveredCount,
            REJECTED: rejectedCount,
            CANCELLED: cancelledCount,
        },

        recentOrders,
    };
};