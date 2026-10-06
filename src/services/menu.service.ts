import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { CreateMenuItemInput, MenuQuery, UpdateMenuItemInput } from "../types/menu.types.js";


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

    return menuItem;
};


export const getAll = async ({ page, limit, search, category, sort, }: MenuQuery) => {

    const skip = (page - 1) * limit;

    const where = {
        isActive: true,
        ...(search ?
            {
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
        ...(category ? { category, } : {}),
    };

    const orderBy =
        sort === "price_asc" ? { price: "asc" as const } : sort === "price_desc" ? { price: "desc" as const } : { createdAt: "desc" as const };

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

    return {
        items,
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

    return menuItem;
};


export const update = async (id: number, data: UpdateMenuItemInput) => {

    const existingItem = await prisma.menuItem.findFirst({
        where: {
            id,
            isActive: true,
        },
    });

    if (!existingItem) {
        throw new AppError("Menu item not found", 404);
    }

    return prisma.menuItem.update({
        where: {
            id,
        },
        data,
    });
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
        where: {
            id,
        },
        data: {
            isActive: false,
            isAvailable: false,
        },
    });
};