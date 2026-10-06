import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword } from "../utils/password.js";
import type { RegisterInput, LoginInput, RefreshTokenPayload } from '../types/auth.types.js'
import { comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";


export const register = async ({ name, email, password, }: RegisterInput) => {

    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        throw new AppError("Email is already registered", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "USER",
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

    return user;
};


export const login = async ({ email, password, }: LoginInput) => {

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const passwordMatched = await comparePassword(password, user.password);

    if (!passwordMatched) {
        throw new AppError("Invalid email or password", 401);
    }

    const payload = {
        userId: user.id,
        role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshTokenHash = await hashPassword(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.upsert({
        where: {
            userId: user.id,
        },

        update: {
            tokenHash: refreshTokenHash,
            expiresAt,
            revokedAt: null,
        },

        create: {
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt,
        },
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
        },
    };
};


export const logout = async (refreshToken: string) => {

    let decoded: { userId: number };

    try {
        const payload = verifyRefreshToken(refreshToken);

        if (typeof payload !== "object" || payload === null || typeof payload.userId !== "number") {
            throw new Error("Invalid token");
        }

        decoded = {
            userId: payload.userId,
        };

    } catch {
        // Logout should still succeed from the client's perspective.
        return;
    }

    await prisma.refreshToken.updateMany({
        where: {
            userId: decoded.userId,
        },
        data: {
            revokedAt: new Date(),
        },
    });
};


export const refreshAccessToken = async (refreshToken: string) => {

    let decoded: RefreshTokenPayload;

    try {
        const payload = verifyRefreshToken(refreshToken);

        if (typeof payload !== "object" || payload === null || typeof payload.userId !== "number" || typeof payload.role !== "string") {
            throw new Error("Invalid token payload");
        }

        decoded = payload as RefreshTokenPayload;

    } catch {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
        where: {
            userId: decoded.userId,
        },
    });

    if (!storedToken) {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    if (storedToken.revokedAt) {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    if (storedToken.expiresAt <= new Date()) {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokenMatches = await comparePassword(refreshToken, storedToken.tokenHash);

    if (!tokenMatches) {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        role: decoded.role,
    });

    return newAccessToken;
};


