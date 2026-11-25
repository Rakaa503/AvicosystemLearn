import type { FastifyInstance } from "fastify";
import { prisma } from "./prisma";

declare module "fastify" {
    interface FastifyInstance {
        prisma: typeof prisma;
    }
}

export async function databasePlugin(app: FastifyInstance) {
    await prisma.$connect();

    app.decorate("prisma", prisma);

    app.addHook("onClose", async () => {
        await prisma.$disconnect();
    });

    app.log.info("PostgreSQL connection established");
}
