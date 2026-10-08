import { getSocketIO } from "../config/socket.js";

export const emitSocketEvent = (room: string, event: string, data: unknown) => {

    try {

        const io = getSocketIO();

        console.log("Emitting socket event:", { room, event, data, });

        const socketsInRoom = io.sockets.adapter.rooms.get(room);

        console.log("Sockets currently in room:", socketsInRoom ? Array.from(socketsInRoom) : []);

        io.to(room).emit(event, data);

    } catch (error) {

        console.error(`Socket notification failed for "${event}":`, error);
    }
};