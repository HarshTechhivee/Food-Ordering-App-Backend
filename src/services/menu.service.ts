import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { CreateMenuItemInput, MenuQuery, UpdateMenuItemInput, } from "../types/menu.types.js";
import { withImageUrl } from "./adminMenu.service.js";

type MenuRatingRow = {
    menuItemId: number;
    averageRating: number;
    totalReviews: bigint;
};

type MenuRatingSummary = {
    averageRating: number;
    totalReviews: number;
};

/**
 * Calculate rating summaries for menu items.
 * Each delivered order contributes its review once to every distinct menu item contained in that order.
 */

const getMenuRatingSummaries = async (): Promise<Map<number, MenuRatingSummary>> => {

    const rows = await prisma.$queryRaw<MenuRatingRow[]>
        `   SELECT
            item_reviews."menuItemId" AS "menuItemId",
            ROUND(AVG(item_reviews.rating)::numeric, 2)::double precision
                AS "averageRating",
            COUNT(*) AS "totalReviews"
        FROM (
            SELECT DISTINCT
                oi."menuItemId",
                r.id AS "reviewId",
                r.rating
            FROM "OrderItem" oi
            INNER JOIN "Order" o
                ON o.id = oi."orderId"
            INNER JOIN "Review" r
                ON r."orderId" = o.id
            WHERE o.status = 'DELIVERED'
        ) AS item_reviews
        GROUP BY item_reviews."menuItemId"
    `;

    return new Map(
        rows.map((row) => [
            row.menuItemId,
            {
                averageRating: Number(row.averageRating.toFixed(2)),
                totalReviews: Number(row.totalReviews),
            },
        ]),
    );
};

/**
 * Attach a rating summary to one menu item.
 * Items without reviews receive a rating of 0 and a count of 0.
 */

const addRatingSummary = <T extends { id: number }>(menuItem: T, summaries: Map<number, MenuRatingSummary>,) => {

    const summary = summaries.get(menuItem.id);

    return {
        ...menuItem,
        averageRating: summary?.averageRating ?? 0,
        totalReviews: summary?.totalReviews ?? 0,
    };
};

export const create = async (data: CreateMenuItemInput) => {

    const menuItem = await prisma.menuItem.create({
        data: {
            name: data.name,
            description: data.description,
            price: data.price,
            image: data.image || null,
            category: data.category,
            isAvailable: data.isAvailable ?? true,
        },
    });

    return withImageUrl(menuItem);
};

export const getAll = async ({ page, limit, search, category, sort, }: MenuQuery) => {

    const skip = (page - 1) * limit;

    const where = {
        isActive: true,
        ...(search
            ? {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        description: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            }
            : {}),
        ...(category ? { category } : {}),
    };

    const orderBy =
        sort === "price_asc"
            ? { price: "asc" as const }
            : sort === "price_desc"
                ? { price: "desc" as const }
                : { createdAt: "desc" as const };

    const [items, total] = await prisma.$transaction([
        prisma.menuItem.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        }),
        prisma.menuItem.count({ where }),
    ]);

    const itemsWithImageUrls = await Promise.all(
        items.map((item) => withImageUrl(item)),
    );

    const ratingSummaries = items.length > 0 ? await getMenuRatingSummaries() : new Map<number, MenuRatingSummary>();

    const itemsWithRatings = itemsWithImageUrls.map((item) => addRatingSummary(item, ratingSummaries),);

    return {
        items: itemsWithRatings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getById = async (id: number) => {

    const menuItem = await prisma.menuItem.findFirst({
        where: {
            id,
            isActive: true,
        },
    });

    if (!menuItem) {
        throw new AppError("Menu item not found", 404);
    }

    const [itemWithImageUrl, ratingSummaries] = await Promise.all([
        withImageUrl(menuItem),
        getMenuRatingSummaries(),
    ]);

    return addRatingSummary(itemWithImageUrl, ratingSummaries);
};

export const update = async (id: number, data: UpdateMenuItemInput,) => {

    const existingItem = await prisma.menuItem.findFirst({
        where: {
            id,
            isActive: true,
        },
    });

    if (!existingItem) {
        throw new AppError("Menu item not found", 404);
    }

    const updatedItem = await prisma.menuItem.update({
        where: { id },
        data,
    });

    return withImageUrl(updatedItem);
};

export const remove = async (id: number) => {

    const existingItem = await prisma.menuItem.findFirst({
        where: {
            id,
            isActive: true,
        },
    });

    if (!existingItem) {
        throw new AppError("Menu item not found", 404);
    }

    await prisma.menuItem.update({
        where: { id },
        data: {
            isActive: false,
            isAvailable: false,
        },
    });
};
