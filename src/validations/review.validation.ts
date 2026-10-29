import Joi from "joi";

export const createReviewSchema = Joi.object({
    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required(),

    comment: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional(),
}).unknown(false);

export const updateReviewSchema = Joi.object({
    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .optional(),

    comment: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional(),
})
    .or("rating", "comment")
    .unknown(false);

export const reviewIdParamsSchema = Joi.object({
    reviewId: Joi.number()
        .integer()
        .positive()
        .required(),
}).unknown(false);

export const orderIdParamsSchema = Joi.object({
    orderId: Joi.number()
        .integer()
        .positive()
        .required(),
}).unknown(false);

export const menuItemIdParamsSchema = Joi.object({
    menuItemId: Joi.number()
        .integer()
        .positive()
        .required(),
}).unknown(false);

export const reviewPaginationSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(10),
}).unknown(false);