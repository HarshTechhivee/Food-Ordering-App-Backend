import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { AuthTokenPayload } from "../types/auth.types.js";
import { verifyAccessToken } from "../utils/jwt.js";

let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5174",
                "https://mzsmxg53-5174.inc1.devtunnels.ms",
            ],
            credentials: true,
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const payload = verifyAccessToken(token) as AuthTokenPayload

            socket.data.userId = payload.userId;
            socket.data.role = payload.role;

            next();
        } catch {
            next(new Error("Invalid or expired access token"));
        }
    });

    io.on("connection", (socket) => {
        const { userId, role } = socket.data;

        console.log(`Socket authenticated: user=${userId}, role=${role}, socket=${socket.id}`);

        socket.join(`user:${userId}`);

        console.log(`Socket joined room: user:${userId}`);

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
};

export const getSocketIO = (): Server => {
    if (!io) {
        throw new Error("Socket.io has not been initialized");
    }

    return io;
};