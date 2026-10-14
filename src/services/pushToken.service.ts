import { prisma } from "../config/prisma.js";

export const savePushToken = async (userId: number, token: string) => {

    return prisma.pushToken.upsert({
        where: { token },
        update: {
            userId,
        },
        create: {
            userId,
            token,
        },
    });
};