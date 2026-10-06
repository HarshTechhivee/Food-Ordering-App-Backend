import type { Role } from "../generated/prisma/client.js";

export interface AuthTokenPayload {
    userId: number;
    role: Role;
}

export interface AuthenticatedRequest {
    userId: number;
    role: Role;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RefreshTokenPayload {
    userId: number;
    role: "USER" | "RESTAURANT_ADMIN";
}