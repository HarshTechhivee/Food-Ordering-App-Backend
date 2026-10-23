
import "dotenv/config";

import { sendEmail } from "../services/email.service.js";

async function main(): Promise<void> {
    const recipient = process.env.SES_TEST_TO;

    if (!recipient) {
        throw new Error("SES_TEST_TO environment variable is required");
    }

    const messageId = await sendEmail({
        to: recipient,
        subject: "FoodHub - Amazon SES Integration Test",
        text: [
            "Hello!",
            "",
            "This is a test email from the FoodHub backend.",
            "Amazon SES email integration is working.",
        ].join("\n"),
        html: `
      <h2>FoodHub SES Integration Test</h2>
      <p>This email was sent by the FoodHub backend.</p>
      <p>Amazon SES email integration is working.</p>
    `,
    });

    console.log("SES accepted the email request.");
    console.log(`Message ID: ${messageId ?? "Not returned"}`);
}

main().catch((error: unknown) => {
    console.error("SES test failed:", error);
    process.exitCode = 1;
});
