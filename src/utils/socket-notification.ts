import { getSocketIO } from "../config/socket.js";

export const emitSocketEvent = (room: string, event: string, data: unknown) => {

    try {

        const io = getSocketIO();

        io.to(room).emit(event, data);

    } catch (error) {

        console.error(`Socket notification failed for "${event}":`, error);
    }
};