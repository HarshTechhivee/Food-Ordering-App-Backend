import type { RequestHandler } from "express";
import * as authService from "../services/auth.service.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export const register: RequestHandler = async (req, res) => {

    const user = await authService.register(req.body);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
            user,
        },
    });
};


export const login: RequestHandler = async (req, res) => {

    const result = await authService.login(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            accessToken: result.accessToken,
            user: result.user,
        },
    });
};


export const logout: RequestHandler = async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });

    res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};


export const me: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: req.user.userId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isVerified: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    res.status(200).json({
        success: true,
        data: {
            user,
        },
    });
};


export const refresh: RequestHandler = async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new AppError("Refresh token is required", 401);
    }

    const accessToken = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
        success: true,
        data: {
            accessToken,
        },
    });
};