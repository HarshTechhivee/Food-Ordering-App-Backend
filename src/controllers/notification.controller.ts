import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { savePushToken } from "../services/pushToken.service.js";

export const registerPushToken: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { token } = req.body;

    if (typeof token !== "string" || !token.trim()) {
        throw new AppError("A valid push token is required", 400);
    }

    await savePushToken(req.user.userId, token.trim());

    res.status(200).json({
        success: true,
        message: "Push token registered successfully",
    });
};