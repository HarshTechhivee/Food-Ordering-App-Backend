import type { RequestHandler } from "express";
import { create } from "../services/menu.service.js";
import { getAllMenuItems, updateMenuItem, getMenuItemById, updateMenuItemAvailability, deleteMenuItem } from "../services/adminMenu.service.js";
import { AppError } from "../utils/AppError.js";
import { MenuQuery } from "../types/menu.types.js";

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

    const image = req.file ? `/uploads/menu/${req.file.filename}` : null;

    const menuItem = await create({ ...body, image, });

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

    const { id } = req.validatedParams as { id: number; };

    const body = req.validatedBody as {
        name?: string;
        description?: string;
        price?: number;
        category?: string;
        isAvailable?: boolean;
    };

    const newImage = req.file ? `/uploads/menu/${req.file.filename}` : undefined;

    const menuItem = await updateMenuItem(id, body, newImage);

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