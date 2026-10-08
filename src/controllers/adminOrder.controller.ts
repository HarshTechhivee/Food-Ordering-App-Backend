import type { RequestHandler } from "express";

import { getAllOrders as getAllOrdersService, updateOrderStatus as updateOrderStatusService, rejectOrder } from "../services/adminOrder.service.js";

import { AppError } from "../utils/AppError.js";

export const getAllOrders: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const orders = await getAllOrdersService();

    res.status(200).json({
        success: true,
        data: orders,
    });
};


export const updateOrderStatus: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { id } = req.validatedParams as { id: number; };

    const data = req.validatedBody as {
        status:
        | "APPROVED"
        | "REJECTED"
        | "OUT_FOR_DELIVERY"
        | "DELIVERED";
    };

    const order = await updateOrderStatusService(id, data);

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data: order,
    });
};


export const rejectOrderController: RequestHandler = async (req, res) => {

    const orderId = Number(req.params.orderId);

    const { rejectionReason } = req.validatedBody as {
        rejectionReason: string;
    };

    const result = await rejectOrder(orderId, rejectionReason);

    return res.status(200).json({
        success: true,
        message: "Order rejected and refund initiated",
        data: result,
    });
};