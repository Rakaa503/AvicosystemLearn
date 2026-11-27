import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { createdResponse } from "../../core/http/api-response";
import { identityService } from "./services/identity.service";
import { tokenService } from "./services/token.service";
import { authenticate } from "./middleware/auth.middleware";

const userResponseSchema = Type.Object({
    id: Type.String(),
    email: Type.String(),
    username: Type.String(),
    role: Type.String(),
    isActive: Type.Boolean(),
    createdAt: Type.String()
});

const tokenResponseSchema = Type.Object({
    accessToken: Type.String(),
    refreshToken: Type.String(),
    tokenType: Type.String(),
    expiresIn: Type.Number()
});

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
                    data: userResponseSchema
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

    app.post("/identity/login", {
        schema: {
            tags: ["Identity"],
            summary: "Authenticate an AviCosystem account",
            body: Type.Object({
                identifier: Type.String({ minLength: 1 }),
                password: Type.String({ minLength: 1 })
            }),
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    message: Type.String(),
                    data: Type.Intersect([
                        Type.Object({
                            user: userResponseSchema
                        }),
                        tokenResponseSchema
                    ])
                })
            }
        }
    }, async (request, reply) => {
        const result = await identityService.login(
            request.body as {
                identifier: string;
                password: string;
            }
        );

        return reply.status(200).send({
            success: true,
            message: "Login successful",
            data: result
        });
    });

    app.post("/identity/refresh", {
        schema: {
            tags: ["Identity"],
            summary: "Rotate refresh token and issue new access token",
            body: Type.Object({
                refreshToken: Type.String({ minLength: 1 })
            }),
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    message: Type.String(),
                    data: tokenResponseSchema
                })
            }
        }
    }, async (request, reply) => {
        const result = await tokenService.refreshAccessToken(
            (request.body as { refreshToken: string }).refreshToken
        );

        return reply.status(200).send({
            success: true,
            message: "Token refreshed successfully",
            data: result
        });
    });

    app.post("/identity/logout", {
        schema: {
            tags: ["Identity"],
            summary: "Revoke current refresh token",
            body: Type.Object({
                refreshToken: Type.String({ minLength: 1 })
            }),
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    message: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        await tokenService.revokeRefreshToken(
            (request.body as { refreshToken: string }).refreshToken
        );

        return reply.status(200).send({
            success: true,
            message: "Logout successful"
        });
    });

    app.get("/identity/me", {
        schema: {
            tags: ["Identity"],
            summary: "Get authenticated user identity",
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    message: Type.String(),
                    data: Type.Object({
                        userId: Type.String()
                    })
                })
            }
        },
        preHandler: authenticate
    }, async (request, reply) => {
        return reply.status(200).send({
            success: true,
            message: "Authenticated successfully",
            data: {
                userId: request.authUser!.userId
            }
        });
    });
}
