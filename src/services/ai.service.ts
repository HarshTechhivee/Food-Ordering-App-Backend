import { AiMessageRole } from "../generated/prisma/client.js";
import type { Prisma } from "../generated/prisma/client.js";
import { ThinkingLevel } from "@google/genai";

import { getMenuImageUrl } from "./s3MenuImage.service.js";

import { extractBudget } from "../modules/AI/budget.util.js";

import type { BudgetConstraint } from "../modules/AI/budget.util.js";

import { requiresVerifiedDietaryInfo, requestsSpicyPreference, matchesExplicitSpicyDescription, } from "../modules/AI/preference.util.js";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

import { getGeminiClient, getGeminiModel, } from "../modules/AI/gemini.client.js";

import { FOODHUB_AI_SYSTEM_INSTRUCTION, GEMINI_RESPONSE_SCHEMA, } from "../modules/AI/ai.prompt.js";

import { AI_INTENTS } from "../types/ai.types.js";

import type { AIChatResult, AIChatServiceInput, GeminiAIResponse, } from "../types/ai.types.js";

const HISTORY_LIMIT = 10;

// --------------------------------------------------
// 1. Validate Gemini's structured response
// --------------------------------------------------

const isGeminiAIResponse = (value: unknown): value is GeminiAIResponse => {

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    if (!("intent" in value) || !("reply" in value) || !("recommendedItemIds" in value)) {
        return false;
    }

    return (
        typeof value.intent === "string" &&
        AI_INTENTS.some((intent) => intent === value.intent) &&

        typeof value.reply === "string" &&
        value.reply.trim().length > 0 &&
        value.reply.length <= 2000 &&

        Array.isArray(value.recommendedItemIds) &&
        value.recommendedItemIds.length <= 10 &&

        value.recommendedItemIds.every((id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0)
    );
};


const parseGeminiResponse = (responseText: string): GeminiAIResponse => {

    let parsed: unknown;

    try {
        parsed = JSON.parse(responseText);
    } catch {
        throw new AppError("AI assistant returned an invalid response", 502);
    }

    if (!isGeminiAIResponse(parsed)) {
        throw new AppError("AI assistant returned an invalid response", 502);
    }

    if (new Set(parsed.recommendedItemIds).size !== parsed.recommendedItemIds.length) {
        throw new AppError("AI assistant returned duplicate menu recommendations", 502);
    }

    return parsed;
};


// --------------------------------------------------
// 2. Format a budget for customer-facing messages
// --------------------------------------------------

const describeBudget = (budget: Exclude<BudgetConstraint, { kind: "none" } | { kind: "unsupported" }>): string => {

    const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

    switch (budget.kind) {

        case "maximum":
            return budget.inclusive ? `at or below ${formatPrice(budget.amount)}` : `below ${formatPrice(budget.amount)}`;

        case "minimum":
            return budget.inclusive ? `at least ${formatPrice(budget.amount)}` : `above ${formatPrice(budget.amount)}`;

        case "range":
            return `between ${formatPrice(budget.min)} and ${formatPrice(budget.max)}`;
    }
};


// --------------------------------------------------
// 3. Generate a title for a new conversation
// --------------------------------------------------

const generateConversationTitle = (message: string): string => {

    const normalizedMessage = message.trim().replace(/\s+/g, " ");

    if (normalizedMessage.length <= 60) {
        return normalizedMessage;
    }

    return `${normalizedMessage.slice(0, 57)}...`;
};


// --------------------------------------------------
// 4. Retrieve the existing conversation and history
// --------------------------------------------------

const getConversationContext = async (userId: number, conversationId?: number) => {

    if (conversationId === undefined) {
        return {
            conversation: null,
            history: [],
        };
    }

    // Verify that the conversation belongs to this user.
    const conversation = await prisma.aiConversation.findFirst({

        where: {
            id: conversationId,
            userId,
        },

        select: {
            id: true,
            userId: true,
            version: true,
        },
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    // Retrieve the latest 10 messages.
    const messages = await prisma.aiMessage.findMany({

        where: {
            conversationId: conversation.id,
        },

        orderBy: [
            {
                createdAt: "desc",
            },
            {
                id: "desc",
            },
        ],

        take: HISTORY_LIMIT,

        select: {
            role: true,
            content: true,
            metadata: true,
        },
    });

    // The query retrieves newest first.
    // Gemini needs the conversation in chronological order.
    messages.reverse();

    return {
        conversation,
        history: messages,
    };
};


// --------------------------------------------------
// 5. Convert database history into Gemini contents
// --------------------------------------------------

const buildGeminiHistory = (history: Awaited<ReturnType<typeof getConversationContext>>["history"]) => {

    return history.map((message) => {

        let content = message.content;

        // Attach previously verified recommendation details
        // to assistant history so Gemini can understand references.
        if (message.role === AiMessageRole.ASSISTANT && message.metadata !== null) {

            content += "\n\nPreviously verified FoodHub recommendation data: " + JSON.stringify(message.metadata);
        }

        return {
            role: message.role === AiMessageRole.USER ? "user" as const : "model" as const,

            parts: [
                {
                    text: content,
                },
            ],
        };
    });
};


// --------------------------------------------------
// 6. Save the customer and assistant messages
// --------------------------------------------------

type AIResponseWithoutConversation = Omit<AIChatResult, "conversationId">;


const saveConversationExchange = async ({ userId, message, conversation, response, }: {

    userId: number;
    message: string;

    conversation: { id: number; version: number; } | null;

    response: AIResponseWithoutConversation;

}): Promise<number> => {

    const assistantMetadata: Prisma.InputJsonObject = {

        intent: response.intent,

        recommendedItems: response.recommendedItems.map((item) => ({

            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            price: item.price,
            image: item.image,
        })),

    };

    // Create a new conversation if this is the first message.
    if (!conversation) {

        const title = generateConversationTitle(message);

        const createdConversation =
            await prisma.aiConversation.create({

                data: {
                    userId,
                    title,
                    version: 1,

                    messages: {
                        create: [
                            {
                                role: AiMessageRole.USER,
                                content: message,
                            },
                            {
                                role: AiMessageRole.ASSISTANT,
                                content: response.reply,
                                metadata: assistantMetadata,
                            },
                        ],
                    },
                },

                select: {
                    id: true,
                },
            });

        return createdConversation.id;
    }


    // Continue an existing conversation.
    // Both messages and the version update are atomic.
    await prisma.$transaction(async (transaction) => {

        const updatedConversation =
            await transaction.aiConversation.updateMany({

                where: {
                    id: conversation.id,
                    userId,
                    version: conversation.version,
                },

                data: {
                    version: {
                        increment: 1,
                    },

                    updatedAt: new Date(),
                },
            });

        // Another request has already updated this conversation.
        if (updatedConversation.count !== 1) {

            throw new AppError("This conversation has changed. Please retry your message.", 409);
        }


        await transaction.aiMessage.createMany({

            data: [
                {
                    conversationId: conversation.id,
                    role: AiMessageRole.USER,
                    content: message,
                },
                {
                    conversationId: conversation.id,
                    role: AiMessageRole.ASSISTANT,
                    content: response.reply,
                    metadata: assistantMetadata,
                },
            ],
        });
    });

    return conversation.id;
};


// --------------------------------------------------
// 7. Main FoodHub AI service
// --------------------------------------------------

export const chatWithAI = async ({ userId, message, conversationId, }: AIChatServiceInput): Promise<AIChatResult> => {

    // A. Retrieve conversation and previous messages.

    const { conversation, history, } = await getConversationContext(userId, conversationId);

    // B. Generate the AI response.
    // We store all successful responses through one common
    // persistence step at the end of this function.

    let result: AIResponseWithoutConversation;

    // C. Extract budget.

    const budget = extractBudget(message);

    // D. Handle an unsupported budget.

    if (budget.kind === "unsupported") {

        result = {
            intent: "other",

            reply:
                "I couldn't understand your budget. Please provide a numeric amount, for example: 'under ₹300' or 'between ₹200 and ₹350'.",

            recommendedItems: [],
        };
    }

    // E. Handle dietary or allergen requests.

    else if (requiresVerifiedDietaryInfo(message)) {

        result = {
            intent: "food_preference",

            reply:
                "I can't reliably verify dietary suitability or ingredient and allergen information from our current menu data. Please contact the restaurant directly to confirm before ordering.",

            recommendedItems: [],
        };
    }

    else {

        // F. Detect spicy preference.

        const wantsSpicyFood = requestsSpicyPreference(message);

        // G. Build the database price filter.

        const priceFilter:
            | {
                lt?: number;
                lte?: number;
                gt?: number;
                gte?: number;
            }
            | undefined =

            budget.kind === "maximum"

                ? budget.inclusive
                    ? { lte: budget.amount }
                    : { lt: budget.amount }

                : budget.kind === "minimum"

                    ? budget.inclusive
                        ? { gte: budget.amount }
                        : { gt: budget.amount }

                    : budget.kind === "range"

                        ? {
                            ...(budget.minInclusive
                                ? { gte: budget.min }
                                : { gt: budget.min }),

                            ...(budget.maxInclusive
                                ? { lte: budget.max }
                                : { lt: budget.max }),
                        }

                        : undefined;


        // H. Retrieve real menu data from PostgreSQL.

        const menuItems = await prisma.menuItem.findMany({

            where: {
                isActive: true,
                isAvailable: true,

                ...(priceFilter ? { price: priceFilter, } : {}),
            },

            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                price: true,
                image: true,
            },

            orderBy: {
                name: "asc",
            },
        });

        // I. Convert Decimal prices and resolve menu image URLs.

        const candidates = await Promise.all(
            menuItems.map(async (item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                category: item.category,
                price: Number(item.price),
                image: await getMenuImageUrl(item.image),
            })),
        );

        // J. Apply spicy preference filtering.

        const eligibleCandidates = wantsSpicyFood ? candidates.filter(matchesExplicitSpicyDescription) : candidates;

        // K. Handle empty candidate lists.

        if (candidates.length === 0) {

            result = {

                intent: budget.kind === "none" ? "menu_question" : "budget_recommendation",

                reply: budget.kind === "none"

                    ? "Sorry, there are currently no menu items available."

                    : `Sorry, no currently available menu items match your requested price condition (${describeBudget(budget)}).`,

                recommendedItems: [],
            };
        }

        else if (eligibleCandidates.length === 0 && wantsSpicyFood) {

            const budgetMessage = budget.kind === "none" ? "" : ` within your requested budget (${describeBudget(budget)})`;

            result = {

                intent: "food_preference",

                reply:
                    `I couldn't find any currently available menu items whose descriptions explicitly mention spicy ingredients or flavours${budgetMessage}. Please check with the restaurant for further details.`,

                recommendedItems: [],
            };
        }

        else {

            // L. Prepare conversation history for Gemini.

            const geminiHistory = buildGeminiHistory(history);

            // M. Generate a structured response.

            const ai = getGeminiClient();

            const response = await ai.models.generateContent({

                model: getGeminiModel(),

                contents: [

                    ...geminiHistory,

                    {
                        role: "user",

                        parts: [
                            {
                                text: JSON.stringify({

                                    customerMessage: message,

                                    availableMenuItems: eligibleCandidates.map(
                                        ({ id, name, description, category, price }) => ({
                                            id,
                                            name,
                                            description,
                                            category,
                                            price,
                                        })
                                    ),
                                }),
                            },
                        ],
                    },
                ],

                config: {

                    systemInstruction: FOODHUB_AI_SYSTEM_INSTRUCTION,

                    thinkingConfig: {
                        thinkingLevel: ThinkingLevel.LOW,
                    },

                    responseMimeType: "application/json",

                    responseJsonSchema:
                        GEMINI_RESPONSE_SCHEMA,
                },

            }).catch((error: unknown) => {

                console.error("Gemini API request failed:", error);

                throw new AppError("AI assistant is temporarily unavailable. Please try again later.", 503);
            });


            // N. Check the model response.

            if (!response.text?.trim()) {

                throw new AppError("AI assistant returned an empty response", 502);
            }


            const geminiResult = parseGeminiResponse(response.text);


            // O. Verify all recommended IDs.

            const candidateMap = new Map(eligibleCandidates.map((item) => [item.id, item]));

            const invalidIds = geminiResult.recommendedItemIds.filter((id) => !candidateMap.has(id));

            if (invalidIds.length > 0) {

                console.error("Gemini returned unverified menu IDs:", invalidIds);

                throw new AppError("AI assistant returned an invalid recommendation", 502);
            }

            // P. Retrieve trusted menu records.

            const recommendedItems = geminiResult.recommendedItemIds.map((id) => candidateMap.get(id)!);

            // Q. Make budget and preference replies controlled.

            const safeReply =
                geminiResult.intent === "budget_recommendation" || geminiResult.intent === "food_preference"
                    ? recommendedItems.length > 0

                        ? `I found ${recommendedItems.length} matching options for you. Here are the available dishes:`

                        : "Sorry, I couldn't find any dishes matching your preferences."

                    : geminiResult.reply;


            result = {
                intent: geminiResult.intent,
                reply: safeReply,
                recommendedItems,
            };
        }
    }

    // R. Persist the complete exchange.
    // This also persists safe responses that didn't require Gemini.

    const savedConversationId = await saveConversationExchange({ userId, message, conversation, response: result, });

    // S. Return the conversation ID and AI response.

    return {
        conversationId: savedConversationId,
        ...result,
    };
};



// --------------------------------------------------
// 8. Retrieve a user's conversations
// --------------------------------------------------

interface GetAIConversationsInput {
    userId: number;
    page: number;
    limit: number;
}

export const getAIConversations = async ({
    userId,
    page,
    limit,
}: GetAIConversationsInput) => {

    const skip = (page - 1) * limit;

    const [total, conversations] = await prisma.$transaction([
        prisma.aiConversation.count({
            where: { userId },
        }),

        prisma.aiConversation.findMany({
            where: { userId },

            orderBy: [
                { updatedAt: "desc" },
                { id: "desc" },
            ],

            skip,
            take: limit,

            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,

                _count: {
                    select: {
                        messages: true,
                    },
                },

                // Latest message is used as a conversation preview.
                messages: {
                    take: 1,

                    orderBy: [
                        { createdAt: "desc" },
                        { id: "desc" },
                    ],

                    select: {
                        role: true,
                        content: true,
                        createdAt: true,
                    },
                },
            },
        }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        conversations: conversations.map((conversation) => ({
            id: conversation.id,
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,

            messageCount: conversation._count.messages,

            lastMessage: conversation.messages[0] ?? null,
        })),

        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};


// --------------------------------------------------
// 9. Retrieve messages from a conversation
// --------------------------------------------------

interface GetAIConversationMessagesInput {
    userId: number;
    conversationId: number;
    page: number;
    limit: number;
}

export const getAIConversationMessages = async ({ userId, conversationId, page, limit, }: GetAIConversationMessagesInput) => {

    // A. Verify conversation ownership.
    const conversation = await prisma.aiConversation.findFirst({
        where: {
            id: conversationId,
            userId,
        },

        select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    // B. Retrieve the total message count and requested page.
    const skip = (page - 1) * limit;

    const [total, messages] = await prisma.$transaction([
        prisma.aiMessage.count({
            where: {
                conversationId,
            },
        }),

        prisma.aiMessage.findMany({
            where: {
                conversationId,
            },

            // Page 1 contains the newest messages.
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],

            skip,
            take: limit,

            select: {
                id: true,
                role: true,
                content: true,
                metadata: true,
                createdAt: true,
            },
        }),
    ]);

    // C. Reverse the page so messages display chronologically.
    messages.reverse();

    const totalPages = Math.ceil(total / limit);

    return {
        conversation,

        messages,

        pagination: {
            page,
            limit,
            total,
            totalPages,

            // True means older messages are available.
            hasMore: skip + messages.length < total,
        },
    };
};
