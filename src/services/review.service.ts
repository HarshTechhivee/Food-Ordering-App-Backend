import { prisma } from "../config/prisma.js";
import type { CreateReviewBody, PaginationQuery, UpdateReviewBody, } from "../types/review.types.js";
import { AppError } from "../utils/AppError.js";
import { emitSocketEvent } from "../utils/socket-notification.js";

/**
 * Broadcast updated rating summaries for every distinct menu item contained in an order.
 * A review contributes once to each distinct menu item in its order.
 */

const emitMenuRatingUpdates = async (orderId: number): Promise<void> => {

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                items: {
                    select: {
                        menuItemId: true,
                    },
                },
            },
        });

        if (!order) {
            return;
        }

        const menuItemIds = [
            ...new Set(order.items.map((item) => item.menuItemId)),
        ];

        if (menuItemIds.length === 0) {
            return;
        }

        const items = await Promise.all(
            menuItemIds.map(async (menuItemId) => {
                const where = {
                    order: {
                        is: {
                            status: "DELIVERED" as const,
                            items: {
                                some: { menuItemId },
                            },
                        },
                    },
                };

                const [summary, totalReviews] = await Promise.all([
                    prisma.review.aggregate({
                        where,
                        _avg: {
                            rating: true,
                        },
                    }),

                    prisma.review.count({ where }),
                ]);

                return {
                    menuItemId,
                    averageRating: summary._avg.rating === null
                        ? 0
                        : Number(summary._avg.rating.toFixed(2)),
                    totalReviews,
                };
            }),
        );

        emitSocketEvent("menu-ratings", "menu:rating-updated", { items },);

    } catch (error: unknown) {
        // A socket update failure must not turn a successful
        // database operation into a failed API response.
        console.error("Failed to broadcast menu rating updates:", error);
    }
};

/**
 * Create one review for a delivered order.
 * Only the owner of the order can submit the review.
 */

export const createReview = async (userId: number, orderId: number, input: CreateReviewBody,) => {

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
        select: {
            id: true,
            status: true,
        },
    });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    if (order.status !== "DELIVERED") {
        throw new AppError("You can review an order only after it has been delivered", 403,);
    }

    try {
        const review = await prisma.review.create({
            data: {
                orderId,
                rating: input.rating,
                comment: input.comment?.trim() || null,
            },
            select: {
                id: true,
                orderId: true,
                rating: true,
                comment: true,
                createdAt: true,
                updatedAt: true,
                order: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        await emitMenuRatingUpdates(orderId);

        return {
            id: review.id,
            orderId: review.orderId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            user: review.order.user,
        };
    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {

            throw new AppError("You have already reviewed this order", 409,);
        }

        throw error;
    }
};

/**
 * Get reviews and rating summary for a menu item.
 *
 * An order's review appears for each distinct menu item
 * contained in that order.
 */

export const getMenuItemReviews = async (menuItemId: number, pagination: PaginationQuery,) => {

    const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        select: { id: true },
    });

    if (!menuItem) {
        throw new AppError("Menu item not found", 404);
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = {
        order: {
            is: {
                status: "DELIVERED" as const,
                items: {
                    some: { menuItemId },
                },
            },
        },
    };

    const [reviews, totalReviews, summary] = await Promise.all([
        prisma.review.findMany({
            where,
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
            skip,
            take: limit,
            select: {
                id: true,
                orderId: true,
                rating: true,
                comment: true,
                createdAt: true,
                updatedAt: true,
                order: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        }),

        prisma.review.count({ where }),

        prisma.review.aggregate({
            where,
            _avg: {
                rating: true,
            },
        }),
    ]);

    return {
        reviews: reviews.map((review) => ({
            id: review.id,
            orderId: review.orderId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            user: review.order.user,
        })),

        pagination: {
            page,
            limit,
            totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
        },

        summary: {
            averageRating: summary._avg.rating
                ? Number(summary._avg.rating.toFixed(2))
                : 0,
            totalReviews,
        },
    };
};

/**
 * Update only the logged-in user's review for a delivered order.
 */

export const updateReview = async (userId: number, reviewId: number, input: UpdateReviewBody,) => {

    const existingReview = await prisma.review.findFirst({
        where: {
            id: reviewId,
            order: {
                is: {
                    userId,
                    status: "DELIVERED",
                },
            },
        },
        select: {
            id: true,
        },
    });

    if (!existingReview) {
        throw new AppError("Review not found", 404);
    }

    const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
            ...(input.rating !== undefined && {
                rating: input.rating,
            }),
            ...(input.comment !== undefined && {
                comment: input.comment?.trim() || null,
            }),
        },
        select: {
            id: true,
            orderId: true,
            rating: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
            order: {
                select: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    await emitMenuRatingUpdates(review.orderId);

    return {
        id: review.id,
        orderId: review.orderId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: review.order.user,
    };
};

/**
 * Delete only the logged-in user's review for a delivered order.
 */

export const deleteReview = async (userId: number, reviewId: number,) => {

    const existingReview = await prisma.review.findFirst({
        where: {
            id: reviewId,
            order: {
                is: {
                    userId,
                    status: "DELIVERED",
                },
            },
        },
        select: {
            id: true,
            orderId: true,
        },
    });

    if (!existingReview) {
        throw new AppError("Review not found", 404);
    }

    await prisma.review.delete({
        where: { id: reviewId },
    });

    await emitMenuRatingUpdates(existingReview.orderId);
};