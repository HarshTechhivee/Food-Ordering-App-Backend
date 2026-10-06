import type { RequestHandler } from "express";
import type { Role } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";

export const requireRole = (...allowedRoles: Role[]): RequestHandler => {

    return (req, _res, next) => {

        if (!req.user) {
            return next(new AppError("Authentication required", 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError("Forbidden", 403));
        }

        next();
    };
};