import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
}

export const generateAccessToken = (payload: object): string => {
    return jwt.sign(payload, accessSecret, {
        expiresIn: accessExpiresIn as jwt.SignOptions["expiresIn"],
    });
};

export const generateRefreshToken = (payload: object): string => {
    return jwt.sign(payload, refreshSecret, {
        expiresIn: refreshExpiresIn as jwt.SignOptions["expiresIn"],
    });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, refreshSecret);
};