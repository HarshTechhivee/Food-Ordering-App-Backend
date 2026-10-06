import fs from "node:fs/promises";
import path from "node:path";
import { UpdateMenuItemInput } from "../types/menu.types.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export const getAllMenuItems = async () => {

    return prisma.menuItem.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

};

export const updateMenuItem = async (id: number, data: UpdateMenuItemInput, newImage?: string) => {

    const existingItem = await prisma.menuItem.findUnique({
        where: {
            id,
        },
    });

    if (!existingItem) {
        throw new AppError("Menu item not found", 404);
    }

    const updateData = { ...data, ...(newImage ? { image: newImage } : {}), };

    const updatedItem = await prisma.menuItem.update({
        where: {
            id,
        },
        data: updateData,
    });

    // Delete old image only after successful DB update

    if (newImage && existingItem.image) {

        const oldImagePath = path.join(process.cwd(), existingItem.image.replace(/^\/+/, ""));

        try {

            await fs.unlink(oldImagePath);

        } catch (error) {

            console.error("Failed to delete old menu image:", error);

            throw new AppError('Failed to delete old menu image:', 403)

        }
    }

    return updatedItem;
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

    return menuItem;
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

    return prisma.menuItem.update({
        where: {
            id,
        },
        data: {
            isAvailable,
        },
    });
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