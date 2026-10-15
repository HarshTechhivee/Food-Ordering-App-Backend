
const developmentOrigins = [
    "http://localhost:5174",
    "https://s1zdx1dk-5174.inc1.devtunnels.ms",
];

export const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV === "production" ? [] : developmentOrigins),].filter((origin): origin is string => Boolean(origin));
