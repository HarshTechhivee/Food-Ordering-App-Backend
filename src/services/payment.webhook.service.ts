import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { emitSocketEvent } from "../utils/socket-notification.js";
import { notifyUser } from "./pushNotification.service.js";
import { getFrontendUrl } from "../utils/frontendUrl.js";
import { sendOrderConfirmationEmail } from "./orderConfirmationEmail.service.js";

async function sendOrderConfirmationEmailSafely(orderId: number, paymentIntent: Stripe.PaymentIntent,): Promise<void> {

    try {

        await sendOrderConfirmationEmail(orderId, paymentIntent,);

    } catch (error: unknown) {

        console.error(`Order #${orderId} was processed, but its confirmation email could not be sent.`, error,);

    }
}

export const handleStripeWebhook = async (event: Stripe.Event) => {

    switch (event.type) {

        case "payment_intent.succeeded": {

            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            const userId = Number(paymentIntent.metadata.userId);

            const items = JSON.parse(paymentIntent.metadata.items) as {
                menuItemId: number;
                quantity: number;
                price: number;
            }[];

            if (!userId) {
                throw new Error("User ID missing from PaymentIntent metadata");
            }

            if (!items || items.length === 0) {
                throw new Error("Items missing from PaymentIntent metadata");
            }

            /*
             * Stripe can send the same webhook more than once.
             * Check whether this PaymentIntent has already
             * created an order.
             */

            const existingOrder = await prisma.order.findUnique({
                where: {
                    stripePaymentIntentId:
                        paymentIntent.id,
                },
            });

            if (existingOrder) {
                /*
                 * The order already exists, so do not create it again.
                 *
                 * If a previous email attempt failed, this gives the
                 * confirmation email another opportunity to be sent.
                 */
                await sendOrderConfirmationEmailSafely(existingOrder.id, paymentIntent,);
                break;
            }

            /*
             * Verify that all referenced menu items still exist.
             *
             * We do NOT check isActive or isAvailable here because
             * the customer has already successfully paid.
             */

            const menuItemIds = items.map((item) => item.menuItemId);

            const menuItems = await prisma.menuItem.findMany({
                where: {
                    id: {
                        in: menuItemIds,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (menuItems.length !== menuItemIds.length) {
                throw new Error("One or more menu items no longer exist");
            }

            /*
             * Use the price snapshot stored in the PaymentIntent
             * metadata.
             *
             * We do NOT fetch the current menu price because the
             * menu price may have changed after payment started.
             */

            let totalAmount = 0;

            const orderItems = items.map((item) => {

                totalAmount += item.price * item.quantity;

                return {
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: item.price,
                };
            });

            /*
             * Verify that the amount calculated from our
             * PaymentIntent metadata matches the amount
             * Stripe actually received.
             */

            const stripeAmount = paymentIntent.amount / 100;

            if (Math.round(totalAmount * 100) !== Math.round(stripeAmount * 100)) {
                throw new Error("Payment amount does not match order total");
            }

            /*
             * Payment succeeded, so now we finally create
             * the actual Order.
             */

            const order = await prisma.$transaction(
                async (tx) => {

                    const createdOrder = await tx.order.create({
                        data: {
                            userId,
                            totalAmount,

                            paymentStatus: "PAID",

                            stripePaymentIntentId:
                                paymentIntent.id,

                            items: {
                                create: orderItems,
                            },
                        },

                        include: {
                            items: {
                                include: {
                                    menuItem: true,
                                },
                            },
                        },
                    });

                    return createdOrder;
                }
            );

            /*
             * Notify the restaurant admin that a new
             * paid order has been created.
             */

            const admin = await prisma.user.findFirst({
                where: {
                    role: "RESTAURANT_ADMIN",
                },
                select: {
                    id: true,
                },
            });

            if (admin) {
                // Keep the existing Socket.IO notification.
                emitSocketEvent(`user:${admin.id}`, "order:new", {
                    orderId: order.id,
                });

                // Send a browser push notification as well.
                void notifyUser(
                    admin.id,
                    "New Order Received!",
                    `Order #${order.id} has been placed and paid successfully.`,
                    getFrontendUrl("/admin/orders")
                ).catch((error: unknown) => {
                    console.error(
                        "Failed to send new order push notification:",
                        error,
                    );
                });
            }

            /*
            * Send the paid-order confirmation email.
            *
            * The order has already been created and marked PAID.
            */
            await sendOrderConfirmationEmailSafely(order.id, paymentIntent,);
            break;
        }

        case "payment_intent.payment_failed": {

            /*
             * No Order exists in the new architecture.
             *
             * Therefore we don't update any Order here.
             */
            break;
        }

        case "refund.created": {

            const refund = event.data.object as Stripe.Refund;

            const paymentIntentId =
                typeof refund.payment_intent === "string"
                    ? refund.payment_intent
                    : refund.payment_intent?.id;

            if (!paymentIntentId) {
                break;
            }

            await prisma.order.update({
                where: {
                    stripePaymentIntentId:
                        paymentIntentId,
                },
                data: {
                    paymentStatus: "REFUNDED",
                    stripeRefundId: refund.id,
                },
            });

            break;
        }

        default:
            break;
    }
};