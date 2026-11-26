import type { FastifyInstance } from "fastify";
import { healthModule } from "../modules/health/health.module";
import { identityModule } from "../modules/identity/identity.module";

export async function registerRoutes(app: FastifyInstance) {
    await app.register(async (api) => {
        await api.register(healthModule);
        await api.register(identityModule);
    }, { prefix: "/api/v1" });
}
