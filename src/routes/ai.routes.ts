
import { Router } from "express";

import { chatWithAIController, getAIConversationsController, getAIConversationMessagesController, } 
from "../controllers/ai.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { aiChatSchema, aiConversationsQuerySchema, aiConversationMessagesParamsSchema, aiConversationMessagesQuerySchema, } 
from "../validations/ai.validation.js";


const router = Router();


// Chat with FoodHub AI
router.post("/chat", authenticate, validate(aiChatSchema, "body"), asyncHandler(chatWithAIController),);


// Get the logged-in user's conversations
router.get("/conversations", authenticate, validate(aiConversationsQuerySchema, "query"), 
asyncHandler(getAIConversationsController),);


// Get messages from a selected conversation
router.get("/conversations/:conversationId/messages", authenticate, validate(aiConversationMessagesParamsSchema, "params"), 
validate(aiConversationMessagesQuerySchema, "query"), asyncHandler(getAIConversationMessagesController),);


export default router;
