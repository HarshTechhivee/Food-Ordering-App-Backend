
import { prisma } from "../config/prisma.js";
import { firebaseMessaging } from "../config/firebaseAdmin.js";

interface PushNotificationInput {
    token: string;
    title: string;
    body: string;
    link?: string;
}

export async function sendPushNotification({ token, title, body, link, }: PushNotificationInput): Promise<void> {

    await firebaseMessaging.send({
        token,
        notification: {
            title,
            body,
        },
        webpush: link
            ? {
                fcmOptions: {
                    link,
                },
            }
            : undefined,
    });
}


export async function notifyUser(userId: number, title: string, body: string, link?: string,): Promise<void> {

    const pushTokens = await prisma.pushToken.findMany({
        where: { userId },
        select: { token: true },
    });

    await Promise.allSettled(
        pushTokens.map(({ token }) =>
            sendPushNotification({
                token,
                title,
                body,
                link,
            }),
        ),
    );
}

