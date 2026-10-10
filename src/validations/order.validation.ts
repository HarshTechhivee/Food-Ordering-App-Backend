import Joi from "joi";

export const createOrderSchema = Joi.object({
    items: Joi.array()
        .items(
            Joi.object({
                menuItemId: Joi.number()
                    .integer()
                    .positive()
                    .required(),

                quantity: Joi.number()
                    .integer()
                    .positive()
                    .max(20)
                    .required(),
            }).unknown(false)
        )
        .min(1)
        .required(),
}).unknown(false);


export const orderIdSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required(),
}).unknown(false);


export const rejectOrderSchema = Joi.object({
    rejectionReason: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required(),
});


export const cancelOrderSchema = Joi.object({
    cancellationReason: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required(),
});
