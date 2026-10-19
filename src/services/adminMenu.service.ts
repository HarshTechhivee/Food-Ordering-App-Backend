import { deleteMenuImageFromS3, getMenuImageUrl, } from "./s3MenuImage.service.js";
import { UpdateMenuItemInput, MenuQuery } from "../types/menu.types.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export const withImageUrl = async <T extends { image: string | null }>(item: T,) => ({
    ...item,
    image: await getMenuImageUrl(item.image),
});

export const getAllMenuItems = async ({ page, limit, search, category, sort, }: MenuQuery) => {

    const skip = (page - 1) * limit;

    const where = {
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

        prisma.menuItem.count({
            where,
        }),
    ]);

    const itemsWithImageUrls = await Promise.all(items.map(withImageUrl),);

    return {
        items: itemsWithImageUrls,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};


export const updateMenuItem = async (id: number, data: UpdateMenuItemInput, newImage?: string,) => {

    const existingItem = await prisma.menuItem.findUnique({
        where: { id },
    });

    if (!existingItem) {
        throw new AppError("Menu item not found", 404);
    }

    const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: {
            ...data,
            ...(newImage ? { image: newImage } : {}),
        },
    });

    // Delete a replaced S3 image only after the database update succeeds.
    if (
        newImage &&
        existingItem.image &&
        existingItem.image !== newImage &&
        existingItem.image.startsWith("menu/")
    ) {

        try {

            await deleteMenuImageFromS3(existingItem.image);

        } catch (error) {

            // The item is already updated, so don't fail the request.
            console.error("Failed to delete replaced S3 menu image:", error,);
        }
    }

    // Don't delete legacy local images during this migration.
    return withImageUrl(updatedItem);
};


export const getMenuItemById = async (id: number) => {

    const menuItem = await prisma.menuItem.findUnique({
        where: {
            id,
        },
    });

    if (!menuItem) {
        throw new AppError("Menu item not found", 404);
    }

    return withImageUrl(menuItem);
};


export const updateMenuItemAvailability = async (id: number, isAvailable: boolean) => {

    const existingItem = await prisma.menuItem.findUnique({
        where: {
            id,
        },
    });

    if (!existingItem) {
        throw new AppError("Menu item not found", 404);
    }

    if (!existingItem.isActive) {
        throw new AppError("Cannot change availability of an inactive menu item", 400);
    }

    const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: { isAvailable },
    });

    return withImageUrl(updatedItem);
};


export const deleteMenuItem = async (id: number) => {

    const existingItem = await prisma.menuItem.findUnique({
        where: {
            id,
        },
    });

    if (!existingItem) {
        throw new AppError("Menu item not found", 404);
    }

    if (!existingItem.isActive) {
        throw new AppError("Menu item is already inactive", 400);
    }

    return prisma.menuItem.update({
        where: {
            id,
        },
        data: {
            isActive: false,
            isAvailable: false,
        },
    });
};