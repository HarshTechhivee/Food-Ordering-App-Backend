import type { AuthTokenPayload } from "./auth.types.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;

            validatedBody?: unknown;
            validatedQuery?: unknown;
            validatedParams?: unknown;
        }
    }
}

export {};