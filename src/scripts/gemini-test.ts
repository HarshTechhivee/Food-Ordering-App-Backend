
import "dotenv/config";

import { GoogleGenAI } from "@google/genai";

const main = async (): Promise<void> => {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing from .env");
    }

    const ai = new GoogleGenAI({
        apiKey,
    });

    const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

    const response = await ai.models.generateContent({
        model,
        contents: "Suggest three popular food categories for a food ordering application.",
    });

    console.log("\nGemini Response:\n");
    console.log(response.text);

};

main().catch((error: unknown) => {
    console.error("Gemini API test failed:", error);
    process.exitCode = 1;
});
