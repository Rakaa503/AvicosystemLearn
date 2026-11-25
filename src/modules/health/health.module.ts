import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { env } from "../../core/config/env";

export async function healthModule(app: FastifyInstance) {
    app.get("/health", {
        schema: {
            tags: ["System"],
            summary: "Check AviCore API health",
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    data: Type.Object({
                        status: Type.String(),
                        service: Type.String(),
                        version: Type.String()
                    })
                })
            }
        }
    }, async () => ({
        success: true,
        data: {
            status: "healthy",
            service: env.APP_NAME,
            version: env.APP_VERSION
        }
    }));
}
