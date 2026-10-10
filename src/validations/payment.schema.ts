import Joi from "joi";

export const createPaymentIntentSchema = Joi.object({
    items: Joi.array()
        .items(
            Joi.object({
                menuItemId: Joi.number()
                    .integer()
                    .positive()
                    .required(),

                quantity: Joi.number()
                    .integer()
                    .min(1)
                    .max(20)
                    .required(),
            })
        )
        .min(1)
        .required(),
});