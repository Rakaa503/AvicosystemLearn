import type { FastifyInstance } from "fastify";
import { healthModule } from "../modules/health/health.module";

export async function registerRoutes(app: FastifyInstance) {
    await app.register(async (api) => {
        await api.register(healthModule);
    }, { prefix: "/api/v1" });
}
