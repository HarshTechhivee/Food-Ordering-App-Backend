
export const AI_INTENTS = ["menu_question", "budget_recommendation", "food_preference", "dish_comparison", "other",] as const;

export type AIIntent = (typeof AI_INTENTS)[number];

export interface AIChatRequest {
    message: string;
    conversationId?: number;
}

export interface AIAvailableMenuItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
}

export interface GeminiAIResponse {
    intent: AIIntent;
    reply: string;
    recommendedItemIds: number[];
}

export interface AIChatServiceInput {
    userId: number;
    message: string;
    conversationId?: number;
}

export interface AIRecommendedItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    image: string | null;
}

export interface AIChatResult {
    conversationId: number;
    intent: AIIntent;
    reply: string;
    recommendedItems: AIRecommendedItem[];
}