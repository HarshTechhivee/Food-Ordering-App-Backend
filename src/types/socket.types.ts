import type { Role } from "../generated/prisma/client.js";

declare module "socket.io" {
    interface SocketData {
        userId: number;
        role: Role;
    }
}