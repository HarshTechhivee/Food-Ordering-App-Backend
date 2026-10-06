import type { RequestHandler } from "express";
import * as menuService from "../services/menu.service.js";
import { CreateMenuItemInput, UpdateMenuItemInput, MenuItemParams, MenuQuery } from "../types/menu.types.js";

export const create: RequestHandler = async (req, res) => {

    const body = req.validatedBody as CreateMenuItemInput;

    const menuItem = await menuService.create(body);

    res.status(201).json({
        success: true,
        message: "Menu item created successfully",
        data: {
            menuItem,
        },
    });
};

export const getAll: RequestHandler = async (req, res) => {

    const query = req.validatedQuery as MenuQuery;

    const result = await menuService.getAll(query);

    res.status(200).json({
        success: true,
        data: result,
    });
};

export const getById: RequestHandler = async (req, res) => {

    const params = req.validatedParams as MenuItemParams

    const menuItem = await menuService.getById(params.id);

    res.status(200).json({
        success: true,
        data: {
            menuItem,
        },
    });
};

export const update: RequestHandler = async (req, res) => {

    const body = req.validatedBody as UpdateMenuItemInput;
    const params = req.validatedParams as MenuItemParams;

    const menuItem = await menuService.update(params.id, body);

    res.status(200).json({
        success: true,
        message: "Menu item updated successfully",
        data: {
            menuItem,
        },
    });
};

export const remove: RequestHandler = async (req, res) => {

    const params = req.validatedParams as MenuItemParams

    await menuService.remove(params.id);

    res.status(200).json({
        success: true,
        message: "Menu item deleted successfully",
    });
};