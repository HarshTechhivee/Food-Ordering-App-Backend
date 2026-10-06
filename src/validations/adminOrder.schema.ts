import Joi from "joi";

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "APPROVED",
      "REJECTED",
      "OUT_FOR_DELIVERY",
      "DELIVERED"
    )
    .required(),
}).unknown(false);

export const adminOrderIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
}).unknown(false);