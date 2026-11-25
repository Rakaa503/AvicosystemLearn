import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";

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
            service: "AviCore",
            version: "1.0.0"
        }
    }));
}
