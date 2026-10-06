import Joi from "joi";

export const createMenuItemSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),

    description: Joi.string()
        .trim()
        .min(5)
        .max(500)
        .required(),

    price: Joi.number()
        .positive()
        .precision(2)
        .required(),

    category: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    isAvailable: Joi.boolean()
        .optional(),
}).unknown(false);


export const updateMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),

  description: Joi.string().trim().min(2).max(500),

  price: Joi.number().positive().precision(2),

  category: Joi.string().trim().min(2).max(50),

  isAvailable: Joi.boolean(),

})
  .min(1)
  .unknown(false);


export const menuItemIdSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required(),
}).unknown(false);


export const menuQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(10),

    search: Joi.string()
        .trim()
        .max(100)
        .optional(),

    category: Joi.string()
        .trim()
        .max(50)
        .optional(),

    sort: Joi.string()
        .valid(
            "price_asc",
            "price_desc",
            "newest"
        )
        .default("newest"),
}).unknown(false);

export const updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required(),
}).unknown(false);