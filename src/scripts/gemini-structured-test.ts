import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { performance } from "node:perf_hooks";
import "dotenv/config";

interface MenuItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    isAvailable: boolean;
    isActive: boolean;
}

interface GeminiResponse {
    intent: string;
    reply: string;
    recommendedItemIds: number[];
}

// Sample data for testing only.
// Later, this will come from PostgreSQL through Prisma.

const menuItems: MenuItem[] = [
    {
        id: 101,
        name: "Classic Burger",
        description: "Juicy burger with cheese and fresh vegetables.",
        category: "Burgers",
        price: 199,
        isAvailable: true,
        isActive: true,
    },
    {
        id: 102,
        name: "Spicy Paneer Burger",
        description: "Grilled paneer patty with spicy sauce.",
        category: "Burgers",
        price: 249,
        isAvailable: true,
        isActive: true,
    },
    {
        id: 103,
        name: "Double Cheese Pizza",
        description: "Pizza loaded with double cheese.",
        category: "Pizza",
        price: 349,
        isAvailable: true,
        isActive: true,
    },
    {
        id: 104,
        name: "Unavailable Sandwich",
        description: "Grilled vegetable sandwich.",
        category: "Sandwiches",
        price: 149,
        isAvailable: false,
        isActive: true,
    },
];

const main = async (): Promise<void> => {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

    const customerQuestion = "Compare the Classic Burger and Spicy Paneer Burger. Which one is cheaper and which one is spicier?";

    const budget = 1000;

    // Backend filters menu items before sending them to Gemini.
    const candidates = menuItems.filter((item) => item.isActive && item.isAvailable && item.price <= budget);

    console.log("Candidate IDs sent to Gemini:", candidates.map((item) => item.id));

    const invalidCandidate = candidates.find((item) => !item.isActive || !item.isAvailable || item.price > budget);

    if (invalidCandidate) {
        throw new Error(`Invalid candidate passed to Gemini: ${invalidCandidate.name}`);
    }

    const menuContext = candidates.map(
        ({ id, name, description, category, price }) => ({ id, name, description, category, price, })
    );

    const apiStartedAt = performance.now();

    const response = await ai.models.generateContent({
        model,

        contents: `
            You are FoodHub's food recommendation assistant.

            Customer question:
            ${customerQuestion}

            Available menu items:
            ${JSON.stringify(menuContext)}

            Rules:
            1. Recommend only items from the supplied menu.
            2. Never invent menu item IDs.
            3. Recommend at most three items.
            4. Respect the customer's budget and preferences.
            5. If no suitable item exists, return an empty ID array.
            6. Do not invent ingredients or dietary claims.

            Return a structured JSON response.
        `,

        config: {

            thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
            },

            responseMimeType: "application/json",

            responseJsonSchema: {
                type: Type.OBJECT,

                properties: {
                    intent: {
                        type: Type.STRING,
                        enum: [
                            "menu_question",
                            "budget_recommendation",
                            "food_preference",
                            "dish_comparison",
                            "other",
                        ],
                    },

                    reply: {
                        type: Type.STRING,
                    },

                    recommendedItemIds: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.INTEGER,
                        },
                        maxItems: 3,
                    },
                },

                required: [
                    "intent",
                    "reply",
                    "recommendedItemIds",
                ],

                propertyOrdering: [
                    "intent",
                    "reply",
                    "recommendedItemIds",
                ],
            },
        },
    });

    const apiDuration = performance.now() - apiStartedAt;

    console.log(`Gemini API response time: ${apiDuration.toFixed(2)} ms`);

    if (!response.text) {
        throw new Error("Gemini returned an empty response.");
    }

    const result = JSON.parse(response.text) as GeminiResponse;

    // Backend verifies every recommended ID.
    const candidateIds = new Set(candidates.map((item) => item.id));

    const invalidIds = result.recommendedItemIds.filter((id) => !candidateIds.has(id));

    if (invalidIds.length > 0) {
        throw new Error(`Gemini returned invalid menu IDs: ${invalidIds.join(", ")}`);
    }

    // Retrieve actual menu information from our trusted data.
    const recommendedItems = candidates.filter((item) => result.recommendedItemIds.includes(item.id));

    console.log("\nCustomer Question:");
    console.log(customerQuestion);

    console.log("\nGemini Structured Response:");
    console.log(JSON.stringify(result, null, 4));

    console.log("\nVerified FoodHub Recommendations:");
    console.log(
        JSON.stringify(recommendedItems, null, 4)
    );
};

main().catch((error: unknown) => {
    console.error("Structured Gemini test failed:", error);
    process.exitCode = 1;
});
