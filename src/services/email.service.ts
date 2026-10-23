
import {
    SESv2Client,
    SendEmailCommand,
} from "@aws-sdk/client-sesv2";

interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

const sesClient = new SESv2Client({
    region: process.env.AWS_REGION ?? "ap-southeast-2",
});

export async function sendEmail({ to, subject, text, html, }: SendEmailOptions): Promise<string | undefined> {

    const fromEmail = process.env.SES_FROM_EMAIL;

    if (!fromEmail) {
        throw new Error("SES_FROM_EMAIL is not configured");
    }

    if (!to.trim() || !subject.trim() || !text.trim()) {
        throw new Error(
            "Recipient, subject, and text body are required",
        );
    }

    const response = await sesClient.send(
        new SendEmailCommand({
            FromEmailAddress: fromEmail,
            Destination: {
                ToAddresses: [to],
            },
            Content: {
                Simple: {
                    Subject: {
                        Data: subject,
                        Charset: "UTF-8",
                    },
                    Body: {
                        Text: {
                            Data: text,
                            Charset: "UTF-8",
                        },
                        ...(html
                            ? {
                                Html: {
                                    Data: html,
                                    Charset: "UTF-8",
                                },
                            }
                            : {}),
                    },
                },
            },
        }),
    );

    return response.MessageId;
}
