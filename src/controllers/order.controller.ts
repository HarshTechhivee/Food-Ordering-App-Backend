import type { RequestHandler } from "express";

import {
    getOrderById as getOrderByIdService,
    getUserOrders as getUserOrdersService,
    cancelOrder
} from "../services/order.service.js";

import type { CreateOrderInput } from "../types/order.types.js";
import { AppError } from "../utils/AppError.js";

// export const createOrder: RequestHandler = async (req, res) => {

//     if (!req.user) {
//         throw new AppError("Authentication required", 401);
//     }

//     const data = req.validatedBody as CreateOrderInput;

//     const order = await createOrderService(req.user.userId, data);

//     res.status(201).json({
//         success: true,
//         message: "Order placed successfully",
//         data: order,
//     });
// };


export const getOrderById: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { id } = req.validatedParams as { id: number; };

    const order = await getOrderByIdService(id, req.user.userId);

    res.status(200).json({
        success: true,
        data: order,
    });
};


export const getUserOrders: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const orders = await getUserOrdersService(req.user.userId);

    res.status(200).json({
        success: true,
        data: orders,
    });
};


export const cancelOrderController: RequestHandler = async (req, res) => {

    const orderId = Number(req.params.orderId);

    const userId = req.user!.userId;

    const { cancellationReason } = req.validatedBody as {
        cancellationReason: string;
    };

    const result = await cancelOrder(orderId, userId, cancellationReason);

    return res.status(200).json({
        success: true,
        message: "Order cancelled and refund initiated",
        data: result,
    });
};