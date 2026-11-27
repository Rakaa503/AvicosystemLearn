import type { FastifyReply, FastifyRequest } from "fastify";
import { tokenService } from "../services/token.service";

declare module "fastify" {
    interface FastifyRequest {
        authUser?: {
            userId: string;
            role?: "USER" | "ADMIN" | "SUPER_ADMIN";
        };
    }
}

export async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return reply.code(401).send({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required"
            }
        });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        return reply.code(401).send({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Invalid access token"
            }
        });
    }

    try {
        const payload = await tokenService.verifyAccessToken(token);

        if (!payload.sub) {
            return reply.code(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Invalid access token"
                }
            });
        }

        request.authUser = {
            userId: payload.sub
        };
    } catch {
        return reply.code(401).send({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Invalid or expired access token"
            }
        });
    }
}

