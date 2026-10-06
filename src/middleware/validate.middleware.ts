import type { NextFunction, Request, Response, } from "express";
import { options, type ObjectSchema } from "joi";

type Property = "body" | "query" | "params";

interface ValidateOptions {
    stripUnknown?: boolean;
}

export const validate = <T>(schema: ObjectSchema, property: Property = "body", options: ValidateOptions = {}) => 
    (req: Request, res: Response, next: NextFunction) => {

    const { error, value } = schema.validate(req[property],
        {
            abortEarly: false,
            stripUnknown:
                options.stripUnknown ?? false,
            convert: true,
        }
    );

    if (error) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            })),
        });
    }

    switch (property) {
        case "body":
            req.validatedBody = value as T;
            break;

        case "query":
            req.validatedQuery = value as T;
            break;

        case "params":
            req.validatedParams = value as T;
            break;
    }

    next();
};
