import type { RequestHandler } from "express";
import { create } from "../services/menu.service.js";
import {
    getAllMenuItems, updateMenuItem, getMenuItemById,
    updateMenuItemAvailability, deleteMenuItem
} from "../services/adminMenu.service.js";
import { AppError } from "../utils/AppError.js";
import { MenuQuery } from "../types/menu.types.js";
import { uploadMenuImageToS3, deleteMenuImageFromS3, } from "../services/s3MenuImage.service.js";

export const getAdminMenu: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { page, limit, search, category, sort, } = req.validatedQuery as MenuQuery;

    const menuItems = await getAllMenuItems({ page, limit, search, category, sort, });

    res.status(200).json({
        success: true,
        data: menuItems,
    });
};


export const createAdminMenuItem: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const body = req.validatedBody as {
        name: string;
        description: string;
        price: number;
        category: string;
        isAvailable: boolean;
    };

    // Upload the image to S3 first, if one was provided.
    const imageKey = req.file ? await uploadMenuImageToS3(req.file) : null;

    let menuItem;

    try {

        menuItem = await create({ ...body, image: imageKey, });

    } catch (error) {

        // Avoid leaving an orphaned S3 object if database creation fails.
        if (imageKey) {
            try {

                await deleteMenuImageFromS3(imageKey);

            } catch (cleanupError) {

                console.error("Failed to clean up uploaded S3 image:", cleanupError,);
            }
        }

        throw error;
    }

    res.status(201).json({
        success: true,
        message: "Menu item created successfully",
        data: menuItem,
    });
};


export const updateAdminMenuItem: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { id } = req.validatedParams as { id: number };

    const body = req.validatedBody as {
        name?: string;
        description?: string;
        price?: number;
        category?: string;
        isAvailable?: boolean;
    };

    // undefined means the admin didn't upload a replacement image.
    const newImageKey = req.file ? await uploadMenuImageToS3(req.file) : undefined;

    let menuItem;

    try {

        menuItem = await updateMenuItem(id, body, newImageKey);

    } catch (error) {

        // If the database update fails, remove the new upload.
        if (newImageKey) {

            try {

                await deleteMenuImageFromS3(newImageKey);

            } catch (cleanupError) {

                console.error("Failed to clean up uploaded S3 image:", cleanupError,);
            }
        }

        throw error;
    }

    res.status(200).json({
        success: true,
        message: "Menu item updated successfully",
        data: menuItem,
    });
};


export const getAdminMenuItem: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { id } = req.validatedParams as { id: number; };

    const menuItem = await getMenuItemById(id);

    res.status(200).json({
        success: true,
        data: menuItem,
    });
};


export const updateAdminMenuItemAvailability: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { id } = req.validatedParams as { id: number; };

    const { isAvailable } = req.validatedBody as { isAvailable: boolean; };

    const menuItem = await updateMenuItemAvailability(id, isAvailable);

    res.status(200).json({
        success: true,
        message: "Menu item availability updated successfully",
        data: menuItem,
    });
};


export const deleteAdminMenuItem: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { id } = req.validatedParams as { id: number; };

    await deleteMenuItem(id);

    res.status(200).json({
        success: true,
        message: "Menu item deleted successfully",
    });
};