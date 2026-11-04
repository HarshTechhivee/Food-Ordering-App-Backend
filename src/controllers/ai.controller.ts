
import type { RequestHandler } from "express";

import {
    chatWithAI,
    getAIConversations,
    getAIConversationMessages,
} from "../services/ai.service.js";

import { AppError } from "../utils/AppError.js";

import type { AIChatRequest } from "../types/ai.types.js";


export const chatWithAIController: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { message, conversationId } = req.validatedBody as AIChatRequest;

    const result = await chatWithAI({ userId: req.user.userId, message, conversationId, });

    res.status(200).json({
        success: true,
        data: result,
    });
};


// --------------------------------------------------
// Get logged-in user's conversations
// --------------------------------------------------

export const getAIConversationsController: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { page, limit } = req.validatedQuery as {
        page: number;
        limit: number;
    };

    const result = await getAIConversations({ userId: req.user.userId, page, limit, });

    res.status(200).json({
        success: true,
        data: result,
    });
};


// --------------------------------------------------
// Get messages from a selected conversation
// --------------------------------------------------

export const getAIConversationMessagesController: RequestHandler = async (req, res) => {

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { conversationId } = req.validatedParams as {
        conversationId: number;
    };

    const { page, limit } = req.validatedQuery as {
        page: number;
        limit: number;
    };

    const result = await getAIConversationMessages({ userId: req.user.userId, conversationId, page, limit, });

    res.status(200).json({
        success: true,
        data: result,
    });
};
