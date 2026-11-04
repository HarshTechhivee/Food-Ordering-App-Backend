import Joi from "joi";

export const aiChatSchema = Joi.object({
    message: Joi.string()
        .trim()
        .min(1)
        .max(1000)
        .required(),

    conversationId: Joi.number()
        .integer()
        .positive()
        .optional(),

}).unknown(false);


export const aiConversationsQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(10),
});


export const aiConversationMessagesParamsSchema = Joi.object({
    conversationId: Joi.number()
        .integer()
        .positive()
        .required(),
});


export const aiConversationMessagesQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(30),
});
