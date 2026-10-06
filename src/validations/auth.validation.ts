import Joi from "joi";

export const registerSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .max(255)
        .required(),

    password: Joi.string()
        .min(8)
        .max(72)
        .required(),
}).unknown(false);

export const loginSchema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .max(255)
        .required(),

    password: Joi.string()
        .min(8)
        .max(72)
        .required(),
}).unknown(false);