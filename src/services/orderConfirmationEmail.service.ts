
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { sendEmail } from "./email.service.js";

const EMAIL_CLAIM_TIMEOUT_MS = 15 * 60 * 1000;

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function isRecipientAllowed(email: string): boolean {

    const configuredRecipients = process.env.SES_ALLOWED_RECIPIENTS;

    // Fail closed: no configured list means no email delivery.
    if (!configuredRecipients?.trim()) {
        return false;
    }

    const allowedRecipients = configuredRecipients.split(",").map((recipient) => recipient.trim().toLowerCase()).filter(Boolean);

    const normalizedEmail = email.trim().toLowerCase();

    return (allowedRecipients.includes("*") || allowedRecipients.includes(normalizedEmail));
}

export async function sendOrderConfirmationEmail(orderId: number, paymentIntent: Stripe.PaymentIntent,): Promise<void> {

    if (process.env.ORDER_CONFIRMATION_EMAIL_ENABLED !== "true") {
        console.info(`Order confirmation email disabled; skipping order #${orderId}`,);
        return;
    }

    const recipientOrder = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
        select: {
            user: {
                select: {
                    email: true,
                },
            },
        },
    });

    if (!recipientOrder) {  
        throw new Error(`Order #${orderId} was not found`);
    }

    const recipientEmail = recipientOrder.user.email;

    if (!isRecipientAllowed(recipientEmail)) {
        console.info(`Order confirmation email skipped for order #${orderId}: recipient is not in SES_ALLOWED_RECIPIENTS`,);
        return;
    }

    const claimedAt = new Date();

    const staleClaimBefore = new Date(claimedAt.getTime() - EMAIL_CLAIM_TIMEOUT_MS,);

    const claim = await prisma.order.updateMany({
        where: {
            id: orderId,
            confirmationEmailSentAt: null,
            OR: [
                { confirmationEmailClaimedAt: null, },
                { confirmationEmailClaimedAt: { lt: staleClaimBefore, }, },
            ],
        },
        data: {
            confirmationEmailClaimedAt: claimedAt,
        },
    });

    if (claim.count !== 1) {
        const currentOrder = await prisma.order.findUnique({
            where: {
                id: orderId,
            },
            select: {
                confirmationEmailSentAt: true,
            },
        });

        if (!currentOrder) {
            throw new Error(`Order #${orderId} was not found`);
        }

        // A previous attempt already completed successfully.
        if (currentOrder.confirmationEmailSentAt) {
            return;
        }

        // Another attempt owns the claim, or it could not be acquired.
        throw new Error(`Order confirmation email for order #${orderId} is already being processed`,);
    }

    let sesAcceptedEmail = false;

    try {
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            throw new Error(`Order #${orderId} was not found`);
        }

        if (
            paymentIntent.status !== "succeeded" ||
            order.paymentStatus !== "PAID" ||
            order.stripePaymentIntentId !== paymentIntent.id
        ) {
            throw new Error(`Cannot send confirmation for an unpaid or mismatched order #${orderId}`,);
        }

        const currency = paymentIntent.currency.toUpperCase();

        const formatMoney = (amount: number): string =>
            new Intl.NumberFormat("en-IN", { style: "currency", currency, }).format(amount);

        const orderDate = new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
        }).format(order.createdAt);

        const itemRows = order.items
            .map((item) => {
                const name = escapeHtml(item.menuItem.name);
                const quantity = item.quantity;
                const unitPrice = Number(item.price);
                const lineTotal = unitPrice * quantity;

                return `
                    <tr>
                        <td style="padding:12px;border-bottom:1px solid #eee;">
                            ${name}
                        </td>
                        <td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">
                            ${quantity}
                        </td>
                        <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
                            ${formatMoney(unitPrice)}
                        </td>
                        <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
                            ${formatMoney(lineTotal)}
                        </td>
                    </tr>
                `;
            })
            .join("");

        const itemText = order.items
            .map((item) => {
                const unitPrice = Number(item.price);
                const lineTotal = unitPrice * item.quantity;

                return [
                    item.menuItem.name,
                    `Quantity: ${item.quantity}`,
                    `Unit price: ${formatMoney(unitPrice)}`,
                    `Subtotal: ${formatMoney(lineTotal)}`,
                ].join(" | ");
            })
            .join("\n");

        const totalAmount = Number(order.totalAmount);

        const paymentMethods =
            paymentIntent.payment_method_types.length > 0 ?
                paymentIntent.payment_method_types
                    .map((method) => method.replaceAll("_", " ").toUpperCase(),).join(", ") : "Not available";

        const customerName = escapeHtml(order.user.name);

        const text = [
            `Hello ${order.user.name},`,
            "",
            "Thank you for ordering from FoodHub!",
            "Your payment was successful and your order is confirmed.",
            "",
            `Order ID: #${order.id}`,
            `Order date: ${orderDate} IST`,
            `Payment status: PAID`,
            `Payment method type: ${paymentMethods}`,
            `Stripe payment reference: ${paymentIntent.id}`,
            "",
            "Order items:",
            itemText,
            "",
            `Total paid: ${formatMoney(totalAmount)}`,
            "",
            "Thank you for choosing FoodHub!",
        ].join("\n");

        const html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>FoodHub Order Confirmation</title>
                </head>
                <body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;">
                    <div style="max-width:680px;margin:24px auto;padding:24px;background:#fff;border-radius:12px;">
                        <h1 style="margin-top:0;color:#ea580c;">FoodHub</h1>

                        <h2>Your order is confirmed!</h2>

                        <p>Hello ${customerName},</p>

                        <p>
                            Your payment was successful. Below are the
                            details of your order and payment.
                        </p>

                        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0;">
                            <p><strong>Order ID:</strong> #${order.id}</p>
                            <p><strong>Order date:</strong> ${escapeHtml(orderDate)} IST</p>
                            <p><strong>Payment status:</strong> Paid</p>
                            <p><strong>Payment method type:</strong> ${escapeHtml(paymentMethods)}</p>
                            <p style="overflow-wrap:anywhere;">
                                <strong>Payment reference:</strong>
                                ${escapeHtml(paymentIntent.id)}
                            </p>
                        </div>

                        <h3>Order details</h3>

                        <table style="width:100%;border-collapse:collapse;font-size:14px;">
                            <thead>
                                <tr style="background:#f9fafb;">
                                    <th style="padding:12px;text-align:left;">Item</th>
                                    <th style="padding:12px;text-align:center;">Qty</th>
                                    <th style="padding:12px;text-align:right;">Unit price</th>
                                    <th style="padding:12px;text-align:right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRows}
                            </tbody>
                        </table>

                        <div style="margin-top:20px;text-align:right;font-size:20px;">
                            <strong>Total paid: ${formatMoney(totalAmount)}</strong>
                        </div>

                        <p style="margin-top:28px;">
                            Thank you for choosing FoodHub. Enjoy your meal!
                        </p>

                        <p style="color:#777;font-size:12px;margin-top:28px;">
                            This email confirms the payment associated with
                            your FoodHub order.
                        </p>
                    </div>
                </body>
            </html>
        `;

        const messageId = await sendEmail({
            to: order.user.email,
            subject: `FoodHub Order #${order.id} — Payment Confirmation`,
            text,
            html,
        });

        // SES accepted the sending request.
        sesAcceptedEmail = true;

        /*
         * Record the successful send and release the claim.
         */

        const recorded = await prisma.order.updateMany({
            where: {
                id: order.id,
                confirmationEmailSentAt: null,
                confirmationEmailClaimedAt: claimedAt,
            },
            data: {
                confirmationEmailSentAt: new Date(),
                confirmationEmailClaimedAt: null,
            },
        });

        if (recorded.count !== 1) {
            throw new Error(`SES accepted the email for order #${order.id}, but its sent status could not be recorded`,);
        }

        console.info(`Order confirmation email accepted by SES for order #${order.id}. Message ID: ${messageId ?? "not returned"}`,);

    } catch (error: unknown) {

        /*
         * If SES did not accept the message, release the claim so
         * a later webhook delivery can retry.
         *
         * If SES accepted it but recording failed, retain the claim
         * temporarily to reduce the risk of an immediate duplicate.
         */

        if (!sesAcceptedEmail) {
            try {
                await prisma.order.updateMany({
                    where: {
                        id: orderId,
                        confirmationEmailSentAt: null,
                        confirmationEmailClaimedAt: claimedAt,
                    },
                    data: {
                        confirmationEmailClaimedAt: null,
                    },
                });
            } catch (releaseError: unknown) {
                console.error(`Failed to release confirmation email claim for order #${orderId}`, releaseError,);
            }
        } else {
            console.error(`SES accepted the email for order #${orderId}, but database tracking failed. Check before retrying.`, error,);
        }

        throw error;
    }
}
