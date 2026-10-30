import { readFileSync } from "node:fs";

import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const sslCaPath = process.env.DATABASE_SSL_CA;

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,

    ...(sslCaPath
        ? {
            ssl: {
                ca: readFileSync(sslCaPath, "utf8"),
                rejectUnauthorized: true,
            },
        }
        : {}),
});

export const prisma = new PrismaClient({
    adapter,
});