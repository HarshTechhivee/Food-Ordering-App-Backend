import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import type { AuthTokenPayload } from "../types/auth.types.js";

export const authenticate: RequestHandler = (req, _res, next) => {

    const authorization = req.headers.authorization;

    if (!authorization) {
        return next(new AppError("Authentication required", 401));
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new AppError("Invalid authorization header", 401));
    }

    try {
        const decoded = verifyAccessToken(token);

        if (typeof decoded !== "object" || decoded === null || !("userId" in decoded) || !("role" in decoded)) {
            return next(new AppError("Invalid access token", 401));
        }

        req.user = decoded as AuthTokenPayload;
        next();

    } catch {
        return next(new AppError("Invalid or expired access token", 401));
    }
};