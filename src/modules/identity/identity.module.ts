import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { createdResponse } from "../../core/http/api-response";
import { identityService } from "./services/identity.service";

export async function identityModule(app: FastifyInstance) {
    app.post("/identity/register", {
        schema: {
            tags: ["Identity"],
            summary: "Register a new AviCosystem account",
            body: Type.Object({
                email: Type.String({ format: "email", maxLength: 255 }),
                username: Type.String({ minLength: 3, maxLength: 30 }),
                password: Type.String({ minLength: 8 })
            }),
            response: {
                201: Type.Object({
                    success: Type.Boolean(),
                    message: Type.String(),
                    data: Type.Object({
                        id: Type.String(),
                        email: Type.String(),
                        username: Type.String(),
                        role: Type.String(),
                        isActive: Type.Boolean(),
                        createdAt: Type.String()
                    })
                })
            }
        }
    }, async (request, reply) => {
        const user = await identityService.register(
            request.body as {
                email: string;
                username: string;
                password: string;
            }
        );

        return reply.status(201).send(
            createdResponse(user, "Account registered successfully")
        );
    });
}
