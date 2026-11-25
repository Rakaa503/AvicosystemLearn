import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { env } from "../config/env";

const adapter = new PrismaPg({
    connectionString: Bun.env.DATABASE_URL!
});

export const prisma = new PrismaClient({
    adapter
});
